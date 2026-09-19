"use strict";
const { randomUUID } = require("node:crypto");
const MAX_TIMEOUT = 2147483647;
const LEASE_MS = 60_000;

// Leases prevent a second startup from stealing live work. Handlers that send
// messages still need their own persistent delivery guard across crash recovery.
class Scheduler {
  constructor({ sqlite, logger = console, now = () => Date.now() }) {
    Object.assign(this, { sqlite, logger, now });
    this.workerId = randomUUID();
    this.handlers = new Map();
    this.timers = new Map();
    this.active = new Set();
    this.started = false;
    this.processing = false;
  }
  register(type, handler) { this.handlers.set(type, handler); return this; }
  hasHandler(type) { return this.handlers.has(type); }
  static toJob(row) {
    if (!row) return null;
    return { id: row.id, type: row.type, executeAt: row.execute_at,
      payload: JSON.parse(row.payload_json), status: row.status, dedupeKey: row.dedupe_key,
      attempts: row.attempts, lastError: row.last_error, createdAt: row.created_at,
      updatedAt: row.updated_at, workerId: row.worker_id, leaseUntil: row.lease_until };
  }
  getJob(id) { return Scheduler.toJob(this.sqlite.prepare("SELECT * FROM scheduled_jobs WHERE id=?").get(String(id))); }
  addJob({ id = randomUUID(), type, executeAt, payload = {}, dedupeKey = null }) {
    if (!this.hasHandler(type)) throw new Error(`Scheduler: no handler registered for job type "${type}"`);
    if (!Number.isFinite(executeAt)) throw new Error("Scheduler: executeAt must be a timestamp");
    this.sqlite.prepare(`INSERT INTO scheduled_jobs
      (id,type,execute_at,payload_json,status,dedupe_key,attempts,created_at,updated_at)
      VALUES (?,?,?,?,'pending',?,0,?,?)`).run(String(id), type, Math.trunc(executeAt), JSON.stringify(payload), dedupeKey, this.now(), this.now());
    this.schedule(this.getJob(id));
    return String(id);
  }
  cancelJob(id) {
    this.clearTimer(id);
    return this.sqlite.prepare("DELETE FROM scheduled_jobs WHERE id=?").run(String(id)).changes > 0;
  }
  claimJob(id) {
    const result = this.sqlite.prepare(`UPDATE scheduled_jobs SET status='running', attempts=attempts+1,
      updated_at=?, worker_id=?, lease_until=? WHERE id=? AND status IN ('pending','overdue')`)
      .run(this.now(), this.workerId, this.now()+LEASE_MS, String(id));
    return result.changes ? this.getJob(id) : null;
  }
  completeJob(id) {
    this.clearTimer(id);
    return this.sqlite.prepare("DELETE FROM scheduled_jobs WHERE id=? AND status='running' AND worker_id=?")
      .run(String(id), this.workerId).changes > 0;
  }
  failJob(id, error) {
    this.clearTimer(id);
    return this.sqlite.prepare(`UPDATE scheduled_jobs SET status='pending',last_error=?,updated_at=?,
      execute_at=?,worker_id=NULL,lease_until=NULL WHERE id=? AND status='running' AND worker_id=?`)
      .run(String(error).slice(0,2000), this.now(), this.now()+30_000, String(id), this.workerId).changes > 0;
  }
  listJobsOfType(type) {
    return this.sqlite.prepare("SELECT * FROM scheduled_jobs WHERE type=? AND status IN ('pending','overdue','running')")
      .all(type).map(Scheduler.toJob);
  }
  async processDue() {
    if (this.processing) return [];
    this.processing = true;
    try {
      this.sqlite.prepare(`UPDATE scheduled_jobs SET status='pending',worker_id=NULL,lease_until=NULL
        WHERE status='running' AND (lease_until IS NULL OR lease_until<=?)`).run(this.now());
      const rows = this.sqlite.prepare("SELECT id FROM scheduled_jobs WHERE status IN ('pending','overdue') AND execute_at<=? ORDER BY execute_at").all(this.now());
      const results = [];
      for (const row of rows) results.push(await this.run(row.id));
      return results;
    } finally { this.processing = false; }
  }
  async run(id) {
    const job = this.claimJob(id);
    if (!job) return { id, ran: false, reason: "already-claimed" };
    this.active.add(id);
    try {
      const handler = this.handlers.get(job.type);
      if (!handler) throw new Error(`No handler for job type "${job.type}"`);
      await handler(job.payload, job);
      this.completeJob(id);
      return { id, ran: true };
    } catch (error) {
      this.logger.error?.(`[scheduler] ${job.type} ${id}:`, error);
      this.failJob(id, error.stack || error.message);
      this.schedule(this.getJob(id));
      return { id, ran: false, reason: "error", error };
    } finally { this.active.delete(id); }
  }
  async start() {
    if (this.started) return;
    this.started = true;
    this.heartbeat = setInterval(() => {
      for (const id of this.active) this.sqlite.prepare("UPDATE scheduled_jobs SET lease_until=? WHERE id=? AND worker_id=? AND status='running'")
        .run(this.now()+LEASE_MS, id, this.workerId);
    }, 10_000);
    this.heartbeat.unref();
    this.poll = setInterval(() => this.processDue().catch(e=>this.logger.error?.(e)), 15_000);
    this.poll.unref();
    await this.processDue();
    for (const row of this.sqlite.prepare("SELECT * FROM scheduled_jobs WHERE status IN ('pending','overdue')").all()) this.schedule(Scheduler.toJob(row));
  }
  stop() {
    this.started = false;
    clearInterval(this.poll); clearInterval(this.heartbeat);
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }
  schedule(job) {
    if (!this.started || !job) return;
    this.clearTimer(job.id);
    const delay = job.executeAt-this.now();
    const timer = setTimeout(() => {
      this.timers.delete(job.id);
      if (!this.started) return;
      if (delay > MAX_TIMEOUT) return this.schedule(job);
      this.run(job.id).catch(e=>this.logger.error?.(e));
    }, Math.max(0, Math.min(delay, MAX_TIMEOUT)));
    timer.unref(); this.timers.set(job.id, timer);
  }
  clearTimer(id) { clearTimeout(this.timers.get(String(id))); this.timers.delete(String(id)); }
}
module.exports = { Scheduler, MAX_TIMEOUT, LEASE_MS };
