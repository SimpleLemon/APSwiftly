"use strict";

const { humanizeDuration } = require("../utils/time");

/**
 * Persistent per-command cooldowns. Mirrors aoi.js:
 *   key = `${commandName}_${userId}_${guildId || "dm"}`
 *   value = absolute expiry timestamp (ms)
 */
class Cooldowns {
  constructor({ sqlite, now = () => Date.now() }) {
    this.sqlite = sqlite;
    this.now = now;
    this.statements = {
      get: sqlite.prepare("SELECT expires_at FROM cooldowns WHERE scope = ? AND key = ?"),
      set: sqlite.prepare(
        `INSERT INTO cooldowns (scope, key, expires_at) VALUES (?, ?, ?)
         ON CONFLICT(scope, key) DO UPDATE SET expires_at = excluded.expires_at`
      ),
      delete: sqlite.prepare("DELETE FROM cooldowns WHERE scope = ? AND key = ?"),
      deleteExpired: sqlite.prepare("DELETE FROM cooldowns WHERE expires_at <= ?"),
    };
  }

  static key(commandName, userId, guildId) {
    return `${commandName}_${userId}_${guildId || "dm"}`;
  }

  getExpiry(commandName, userId, guildId, scope = "command") {
    const row = this.statements.get.get(scope, Cooldowns.key(commandName, userId, guildId));
    return row ? row.expires_at : 0;
  }

  /** Returns remaining ms, or 0 when the command can run. */
  check(commandName, userId, guildId, scope = "command") {
    const expiry = this.getExpiry(commandName, userId, guildId, scope);
    const remaining = expiry - this.now();
    return remaining > 0 ? remaining : 0;
  }

  /** Applies a cooldown and returns the new expiry timestamp. */
  set(commandName, userId, guildId, durationMs, scope = "command") {
    const expiry = this.now() + durationMs;
    this.statements.set.run(scope, Cooldowns.key(commandName, userId, guildId), expiry);
    return expiry;
  }

  clear(commandName, userId, guildId, scope = "command") {
    this.statements.delete.run(scope, Cooldowns.key(commandName, userId, guildId));
  }

  cleanupExpired() {
    return this.statements.deleteExpired.run(this.now()).changes;
  }

  /** Imports an absolute expiry from the legacy `cooldown_*` records. */
  importExpiry(commandName, userId, guildId, expiry, scope = "command") {
    this.statements.set.run(scope, Cooldowns.key(commandName, userId, guildId), expiry);
  }

  static formatRemaining(ms) {
    return humanizeDuration(ms);
  }
}

module.exports = { Cooldowns };
