"use strict";

const { serializeValue, deserializeValue, typeOf } = require("./database");
const { getDefault, parseByType } = require("./defaults");

/**
 * Storage layer that preserves aoi.js KeyValue semantics:
 *   raw key = id ? `${name}_${id}` : name
 *
 * Scope id composition (from aoi.js get/set functions):
 *   global      -> name
 *   guild       -> name_<guildId>
 *   guild user  -> name_<userId>_<guildId>
 *   global user -> name_<userId>
 *   channel     -> name_<channelId>
 *   message     -> name_<messageId>
 */
class Repository {
  constructor(sqlite) {
    this.sqlite = sqlite;
    this.statements = {
      get: sqlite.prepare("SELECT value_json, value_type FROM kv WHERE namespace = ? AND key = ?"),
      set: sqlite.prepare(
        `INSERT INTO kv (namespace, key, value_json, value_type, updated_at)
         VALUES (@namespace, @key, @value_json, @value_type, @updated_at)
         ON CONFLICT(namespace, key) DO UPDATE SET
           value_json = excluded.value_json,
           value_type = excluded.value_type,
           updated_at = excluded.updated_at`
      ),
      delete: sqlite.prepare("DELETE FROM kv WHERE namespace = ? AND key = ?"),
      deletePrefix: sqlite.prepare("DELETE FROM kv WHERE namespace = ? AND key LIKE ? ESCAPE '\\'"),
      list: sqlite.prepare("SELECT key, value_json FROM kv WHERE namespace = ? AND key LIKE ? ESCAPE '\\'"),
      count: sqlite.prepare("SELECT COUNT(*) AS n FROM kv WHERE namespace = ?"),
    };
  }

  static rawKey(name, id) {
    return id ? `${name}_${id}` : name;
  }

  static escapeLike(value) {
    return String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`);
  }

  rawGet(namespace, rawKey) {
    const row = this.statements.get.get(namespace, rawKey);
    if (!row) return undefined;
    return { value: deserializeValue(row.value_json), type: row.value_type, key: rawKey };
  }

  rawSet(namespace, rawKey, value) {
    this.statements.set.run({
      namespace,
      key: rawKey,
      value_json: serializeValue(value),
      value_type: typeOf(value),
      updated_at: Date.now(),
    });
    return value;
  }

  rawDelete(namespace, rawKey) {
    this.statements.delete.run(namespace, rawKey);
  }

  rawHas(namespace, rawKey) {
    return this.statements.get.get(namespace, rawKey) !== undefined;
  }

  rawList(namespace, prefix = "") {
    const rows = this.statements.list.all(namespace, `${Repository.escapeLike(prefix)}%`);
    return rows.map((row) => ({ key: row.key, value: deserializeValue(row.value_json) }));
  }

  count(namespace) {
    return this.statements.count.get(namespace).n;
  }

  /**
   * Reads a scoped variable with aoi.js default fallback semantics.
   * Returns the stored value when the record exists (even "" / 0 / false).
   */
  getScoped(table, name, id) {
    const rawKey = Repository.rawKey(name, id);
    const row = this.statements.get.get(table, rawKey);
    if (row) return deserializeValue(row.value_json);
    return getDefault(table, name);
  }

  hasScoped(table, name, id) {
    return this.statements.get.get(table, Repository.rawKey(name, id)) !== undefined;
  }

  /**
   * Writes a scoped variable, coercing the value to the registered default's
   * type using the same rules as aoi.js VariableManager.parseData.
   */
  setScoped(table, name, id, value) {
    const coerced = parseByType(value, getDefault(table, name));
    this.rawSet(table, Repository.rawKey(name, id), coerced);
    return coerced;
  }

  deleteScoped(table, name, id) {
    this.rawDelete(table, Repository.rawKey(name, id));
  }

  // ---- global ---------------------------------------------------------
  getVar(name, table = "main") {
    return this.getScoped(table, name, null);
  }

  setVar(name, value, table = "main") {
    return this.setScoped(table, name, null, value);
  }

  deleteVar(name, table = "main") {
    this.deleteScoped(table, name, null);
  }

  hasVar(name, table = "main") {
    return this.hasScoped(table, name, null);
  }

  // ---- guild ----------------------------------------------------------
  getGuildVar(guildId, name, table = "main") {
    return this.getScoped(table, name, guildId);
  }

  setGuildVar(guildId, name, value, table = "main") {
    return this.setScoped(table, name, guildId, value);
  }

  deleteGuildVar(guildId, name, table = "main") {
    this.deleteScoped(table, name, guildId);
  }

  hasGuildVar(guildId, name, table = "main") {
    return this.hasScoped(table, name, guildId);
  }

  // ---- guild user -----------------------------------------------------
  getUserVar(guildId, userId, name, table = "main") {
    return this.getScoped(table, name, `${userId}_${guildId}`);
  }

  setUserVar(guildId, userId, name, value, table = "main") {
    return this.setScoped(table, name, `${userId}_${guildId}`, value);
  }

  deleteUserVar(guildId, userId, name, table = "main") {
    this.deleteScoped(table, name, `${userId}_${guildId}`);
  }

  // ---- global user ----------------------------------------------------
  getGlobalUserVar(userId, name, table = "main") {
    return this.getScoped(table, name, userId);
  }

  setGlobalUserVar(userId, name, value, table = "main") {
    return this.setScoped(table, name, userId, value);
  }

  deleteGlobalUserVar(userId, name, table = "main") {
    this.deleteScoped(table, name, userId);
  }

  // ---- channel --------------------------------------------------------
  getChannelVar(channelId, name, table = "custom") {
    return this.getScoped(table, name, channelId);
  }

  setChannelVar(channelId, name, value, table = "custom") {
    return this.setScoped(table, name, channelId, value);
  }

  deleteChannelVar(channelId, name, table = "custom") {
    this.deleteScoped(table, name, channelId);
  }

  // ---- message --------------------------------------------------------
  getMessageVar(messageId, name, table = "main") {
    return this.getScoped(table, name, messageId);
  }

  setMessageVar(messageId, name, value, table = "main") {
    return this.setScoped(table, name, messageId, value);
  }

  deleteMessageVar(messageId, name, table = "main") {
    this.deleteScoped(table, name, messageId);
  }

  // ---- bulk helpers ---------------------------------------------------
  /** Mirrors aoi.js $resetUserVar: delete name_*_<guildId> guild-user records. */
  resetGuildUserVars(guildId, name, table = "main") {
    const rows = this.rawList(table, `${name}_`);
    const suffix = `_${guildId}`;
    const tx = this.sqlite.transaction(() => {
      let removed = 0;
      for (const row of rows) {
        if (row.key.endsWith(suffix) && row.key.split("_").length === 3) {
          this.rawDelete(table, row.key);
          removed++;
        }
      }
      return removed;
    });
    return tx();
  }

  /** Global-user records (exactly name_<id>) sorted by numeric value. */
  listGlobalUserVars(name, table, order = "desc", limit = 10) {
    const rows = this.rawList(table, `${name}_`);
    return rows
      .filter((row) => row.key.split("_").length === 2)
      .map((row) => ({
        id: row.key.slice(name.length + 1),
        value: Number(row.value),
      }))
      .filter((row) => !Number.isNaN(row.value))
      .sort((a, b) => (order === "asc" ? a.value - b.value : b.value - a.value))
      .slice(0, limit);
  }
}

module.exports = { Repository };
