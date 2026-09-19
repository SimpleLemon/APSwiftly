"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS kv (
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  value_type TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (namespace, key)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS legacy_aoi_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_id TEXT NOT NULL,
  source_table TEXT NOT NULL,
  raw_key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  value_type TEXT NOT NULL,
  migrated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_legacy_import ON legacy_aoi_records(import_id);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  execute_at INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  dedupe_key TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_status_time ON scheduled_jobs(status, execute_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_dedupe ON scheduled_jobs(dedupe_key) WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS cooldowns (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (scope, key)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY, channel_id TEXT NOT NULL, guild_id TEXT NOT NULL,
  origin TEXT NOT NULL, status TEXT NOT NULL, due_at INTEGER NOT NULL,
  schedule_message_id TEXT, sent_message_id TEXT, nonce TEXT NOT NULL,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, last_error TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS checkins_active_channel ON checkins(channel_id)
  WHERE status IN ('creating','pending','sending','uncertain');
CREATE TABLE IF NOT EXISTS checkin_channels (
  channel_id TEXT PRIMARY KEY, last_activity_at INTEGER NOT NULL DEFAULT 0,
  cooldown_at INTEGER NOT NULL DEFAULT 0, disabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
`;

function openDatabase(filename) {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }

  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("synchronous = FULL");
  db.exec(SCHEMA);
  db.transaction(() => {
    const columns = new Set(db.pragma("table_info(scheduled_jobs)").map(row => row.name));
    if (!columns.has("worker_id")) db.exec("ALTER TABLE scheduled_jobs ADD COLUMN worker_id TEXT");
    if (!columns.has("lease_until")) db.exec("ALTER TABLE scheduled_jobs ADD COLUMN lease_until INTEGER");
  }).immediate();
  return db;
}

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function serializeValue(value) {
  return JSON.stringify(value === undefined ? null : value);
}

function deserializeValue(json) {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

module.exports = { openDatabase, SCHEMA, serializeValue, deserializeValue, typeOf };
