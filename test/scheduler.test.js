"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { openDatabase } = require("../src/db/database");
const { Scheduler } = require("../src/db/scheduler");

function makeScheduler() {
  const sqlite = openDatabase(":memory:");
  const logger = { error() {}, warn() {}, log() {} };
  const scheduler = new Scheduler({ sqlite, logger });
  return { sqlite, scheduler };
}

test("future job runs after executeAt and is removed", async () => {
  const { sqlite, scheduler } = makeScheduler();
  let ran = 0;
  scheduler.register("remi", async () => {
    ran++;
  });
  scheduler.addJob({ id: "j1", type: "remi", executeAt: Date.now() - 1, payload: { a: 1 } });
  await scheduler.processDue();
  assert.equal(ran, 1);
  assert.equal(scheduler.getJob("j1"), null);
  sqlite.close();
});

test("overdue job after restart is processed exactly once", async () => {
  const { sqlite, scheduler } = makeScheduler();
  scheduler.register("remi", async () => {});
  scheduler.addJob({ id: "j2", type: "remi", executeAt: Date.now() + 60_000 });
  scheduler.stop();

  const restarted = new Scheduler({ sqlite, logger: { error() {} } });
  let ran = 0;
  restarted.register("remi", async () => {
    ran++;
  });
  await restarted.start();
  assert.equal(ran, 0);

  await restarted.processDue();
  assert.equal(ran, 0);
  restarted.stop();
  sqlite.close();
});

test("two workers cannot run the same job twice", async () => {
  const { sqlite, scheduler } = makeScheduler();
  let ran = 0;
  const handler = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    ran++;
  };
  scheduler.register("remi", handler);
  scheduler.addJob({ id: "j3", type: "remi", executeAt: Date.now() - 1 });

  const results = await Promise.all([scheduler.processDue(), scheduler.processDue()]);
  const executed = results.flat().filter((entry) => entry.ran).length;
  assert.equal(ran, 1);
  assert.equal(executed, 1);
  sqlite.close();
});

test("cancellation prevents a pending job from running", async () => {
  const { sqlite, scheduler } = makeScheduler();
  let ran = 0;
  scheduler.register("remi", async () => {
    ran++;
  });
  scheduler.addJob({ id: "j4", type: "remi", executeAt: Date.now() - 1 });
  assert.equal(scheduler.cancelJob("j4"), true);
  await scheduler.processDue();
  assert.equal(ran, 0);
  sqlite.close();
});

test("restart recovers a running job and re-runs it", async () => {
  const { sqlite, scheduler } = makeScheduler();
  scheduler.register("remi", async () => {});
  scheduler.addJob({ id: "j5", type: "remi", executeAt: Date.now() - 1 });
  // Simulate a crash mid-run: claim it but never complete.
  assert.ok(scheduler.claimJob("j5"));

  const restarted = new Scheduler({ sqlite, logger: { error() {} } });
  let ran = 0;
  restarted.register("remi", async () => {
    ran++;
  });
  await restarted.start();
  assert.equal(ran, 0, "must not steal an unexpired lease");
  sqlite.prepare("UPDATE scheduled_jobs SET lease_until=0 WHERE id= ?").run("j5");
  await restarted.processDue();
  assert.equal(ran, 1);
  restarted.stop();
  sqlite.close();
});

test("handler failure requeues the job", async () => {
  const { sqlite, scheduler } = makeScheduler();
  let attempts = 0;
  scheduler.register("remi", async () => {
    attempts++;
    throw new Error("nope");
  });
  scheduler.addJob({ id: "j6", type: "remi", executeAt: Date.now() - 1 });
  await scheduler.processDue();
  assert.equal(attempts, 1);
  const job = scheduler.getJob("j6");
  assert.equal(job.status, "pending");
  assert.match(job.lastError, /nope/);
  sqlite.close();
});

test("dedupe key prevents duplicate scheduled jobs", () => {
  const { sqlite, scheduler } = makeScheduler();
  scheduler.register("checkinTimeout", async () => {});
  scheduler.addJob({ id: "a", type: "checkinTimeout", executeAt: Date.now(), dedupeKey: "chan-1" });
  assert.throws(() => scheduler.addJob({ id: "b", type: "checkinTimeout", executeAt: Date.now(), dedupeKey: "chan-1" }));
  sqlite.close();
});

test("addJob rejects unknown job types", () => {
  const { sqlite, scheduler } = makeScheduler();
  assert.throws(() => scheduler.addJob({ type: "nope", executeAt: Date.now() }), /no handler/);
  sqlite.close();
});

test("stale check-in job cannot send (idempotency claim)", async () => {
  const { sqlite, scheduler } = makeScheduler();
  const { Repository } = require("../src/db/repository");
  const repo = new Repository(sqlite);

  let sent = 0;
  scheduler.register("checkinTimeout", async (payload, job) => {
    const active = repo.getChannelVar(payload.channelID, "checkintimeoutid", "custom");
    if (String(active) !== String(job.id)) return;
    repo.setChannelVar(payload.channelID, "checkintimeoutid", "", "custom");
    sent++;
  });

  // Active job matches: sends once.
  repo.setChannelVar("chan-1", "checkintimeoutid", "job-1", "custom");
  scheduler.addJob({ id: "job-1", type: "checkinTimeout", executeAt: Date.now() - 1, payload: { channelID: "chan-1" } });
  await scheduler.processDue();
  assert.equal(sent, 1);

  // A replayed/stale job whose id is no longer active must not send.
  scheduler.addJob({ id: "job-2", type: "checkinTimeout", executeAt: Date.now() - 1, payload: { channelID: "chan-1" } });
  await scheduler.processDue();
  assert.equal(sent, 1);
  sqlite.close();
});

test("another scheduler startup does not reset a live worker's claim", async () => {
  const {sqlite,scheduler}=makeScheduler();
  let calls=0,release;
  const gate=new Promise(resolve=>{release=resolve;});
  const handler=async()=>{calls++;await gate;};
  scheduler.register("probe",handler);
  scheduler.addJob({id:"live",type:"probe",executeAt:Date.now()-1});
  const first=scheduler.processDue();
  await new Promise(resolve=>setImmediate(resolve));
  const second=new Scheduler({sqlite,logger:{error(){}}});second.register("probe",handler);
  await second.start();assert.equal(calls,1);
  release();await first;second.stop();sqlite.close();
});

test("pending due job survives database close and reopen", async t => {
  const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"scheduler-restart-")),file=path.join(dir,"state.sqlite");
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  let sqlite=openDatabase(file),scheduler=new Scheduler({sqlite,now:()=>1000});
  scheduler.register("probe",async()=>{});scheduler.addJob({id:"pending",type:"probe",executeAt:2000});sqlite.close();
  sqlite=openDatabase(file);scheduler=new Scheduler({sqlite,now:()=>3000});let sent=0;scheduler.register("probe",async()=>sent++);
  await scheduler.start();await scheduler.processDue();assert.equal(sent,1);assert.equal(scheduler.getJob("pending"),null);
  scheduler.stop();sqlite.close();
});
