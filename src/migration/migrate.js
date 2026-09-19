"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const { readDatabase, checksum, counts } = require("./aoiReader");
const { openDatabase, serializeValue, typeOf } = require("../db/database");

/**
 * Lossless aoi.db -> SQLite migration.
 *
 * - main/custom records are copied verbatim into the runtime `kv` table.
 * - every source record (including __aoijs_vars__ internals) is archived in
 *   `legacy_aoi_records` so nothing is silently dropped.
 * - known `setTimeout_*` records become `scheduled_jobs`.
 * - `cooldown_*` records become `cooldowns`.
 * - unknown ACTIVE timeout types abort the migration.
 */

const KNOWN_TIMEOUT_TYPES = new Set(["remi", "checkinTimeout"]);

class MigrationError extends Error {}

function importIdFor(sourcePath) {
  return crypto.createHash("sha256").update(path.resolve(sourcePath)).digest("hex").slice(0, 16);
}

function decodeTimeout(record) {
  const value = record.value;
  if (!value || typeof value !== "object") return null;
  const name = value.__timeoutName__;
  if (!name) return null;
  const id = value.__id__;
  const executeAt = Number(value.__duration__);
  const payload = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key.startsWith("__")) continue;
    payload[key] = entry;
  }
  return { id: String(id), type: String(name), executeAt, payload };
}

function decodeCooldown(rawKey, value) {
  // rawKey = cooldown_<command>_<userId>_<guildId|dm>
  if (!rawKey.startsWith("cooldown_")) return null;
  const rest = rawKey.slice("cooldown_".length);
  const parts = rest.split("_");
  if (parts.length < 3) return null;
  const guildId = parts.pop();
  const userId = parts.pop();
  const commandName = parts.join("_");
  const expiresAt = Number(value);
  if (!Number.isFinite(expiresAt)) return null;
  return { commandName, userId, guildId, expiresAt };
}

function migrate({
  sourcePath,
  destinationPath,
  logger = console,
  now = () => Date.now(),
  allowExisting = false,
  dryRun = false,
} = {}) {
  if (!sourcePath) throw new MigrationError("sourcePath is required");
  if (!destinationPath) throw new MigrationError("destinationPath is required");
  if (!fs.existsSync(sourcePath)) throw new MigrationError(`Source database not found: ${sourcePath}`);

  if (path.resolve(sourcePath) === path.resolve(destinationPath)) throw new MigrationError("Source and destination must differ");
  for (const table of ["main", "custom", "__aoijs_vars__"]) {
    if (!fs.statSync(path.join(sourcePath, table), { throwIfNoEntry: false })?.isDirectory()) throw new MigrationError(`Missing source table directory: ${table}`);
  }
  const exportData = readDatabase(sourcePath);
  const sourceCounts = counts(exportData);
  const sourceChecksum = checksum(exportData);
  const importId = importIdFor(sourcePath);
  const migratedAt = now();

  const report = {
    importId,
    sourcePath: path.resolve(sourcePath),
    destinationPath: path.resolve(destinationPath),
    migratedAt,
    sourceCounts,
    sourceChecksum,
    warnings: [],
    jobs: [],
    cooldowns: 0,
    unknownTimeouts: [],
  };

  // Validate timeouts BEFORE writing anything.
  for (const record of exportData.__aoijs_vars__.values()) {
    if (!record.key.startsWith("setTimeout_")) continue;
    const timeout = decodeTimeout(record);
    if (!timeout) {
      throw new MigrationError(`Unparseable timeout record ${record.key}`);
    }
    if (!Number.isFinite(timeout.executeAt) || timeout.id === "undefined") throw new MigrationError(`Invalid timeout ${record.key}`);
    if (!KNOWN_TIMEOUT_TYPES.has(timeout.type)) {
      report.unknownTimeouts.push({ key: record.key, type: timeout.type });
    } else {
      report.jobs.push(timeout);
    }
  }

  if (report.unknownTimeouts.length) {
    throw new MigrationError(
      `Refusing to migrate: unknown active timeout type(s) ${report.unknownTimeouts.map((entry) => entry.type).join(", ")}`
    );
  }

  if (dryRun) {
    report.destinationCounts = null;
    return report;
  }

  fs.mkdirSync(path.dirname(path.resolve(destinationPath)), { recursive: true });
  if (fs.existsSync(destinationPath) && !allowExisting) throw new MigrationError(`Destination already exists: ${destinationPath}`);
  if (["-wal", "-shm"].some(suffix => fs.existsSync(`${destinationPath}${suffix}`))) throw new MigrationError("Destination has SQLite sidecars; stop all writers and checkpoint it before replacement");
  const temporary = `${destinationPath}.import-${crypto.randomUUID()}`;
  const sqlite = openDatabase(temporary);
  try {
  const insertLegacy = sqlite.prepare(
    `INSERT INTO legacy_aoi_records (import_id, source_table, raw_key, value_json, value_type, migrated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertKv = sqlite.prepare(
    `INSERT INTO kv (namespace, key, value_json, value_type, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertJob = sqlite.prepare(
    `INSERT INTO scheduled_jobs (id, type, execute_at, payload_json, status, dedupe_key, attempts, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', ?, 0, ?, ?)`
  );
  const insertCooldown = sqlite.prepare(
    `INSERT INTO cooldowns (scope, key, expires_at) VALUES ('command', ?, ?)
     ON CONFLICT(scope, key) DO UPDATE SET expires_at = excluded.expires_at`
  );
  const setMeta = sqlite.prepare(
    `INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v`
  );

  const run = sqlite.transaction(() => {
    let archived = 0;
    for (const table of ["main", "custom", "__aoijs_vars__"]) {
      for (const record of exportData[table].values()) {
        insertLegacy.run(importId, table, record.key, serializeValue(record.value), typeOf(record.value), migratedAt);
        archived++;
      }
    }

    for (const table of ["main", "custom"]) {
      for (const record of exportData[table].values()) {
        insertKv.run(table, record.key, serializeValue(record.value), typeOf(record.value), migratedAt);
      }
    }

    for (const job of report.jobs) {
      insertJob.run(
        job.id,
        job.type,
        Math.trunc(job.executeAt),
        JSON.stringify(job.payload),
        `aoi-timeout:${job.id}`,
        migratedAt,
        migratedAt
      );
    }

    for (const record of exportData.__aoijs_vars__.values()) {
      const cooldown = decodeCooldown(record.key, record.value);
      if (!cooldown) continue;
      insertCooldown.run(`${cooldown.commandName}_${cooldown.userId}_${cooldown.guildId}`, cooldown.expiresAt);
      report.cooldowns++;
    }

    setMeta.run("migration_import_id", importId);
    setMeta.run("migration_source", report.sourcePath);
    setMeta.run("migration_checksum", sourceChecksum);
    setMeta.run("migration_at", String(migratedAt));
    return archived;
  });

  const archived = run();

  // Verify counts after import.
  const kvMain = sqlite.prepare("SELECT COUNT(*) AS n FROM kv WHERE namespace = 'main'").get().n;
  const kvCustom = sqlite.prepare("SELECT COUNT(*) AS n FROM kv WHERE namespace = 'custom'").get().n;
  const legacyCount = sqlite.prepare("SELECT COUNT(*) AS n FROM legacy_aoi_records WHERE import_id = ?").get(importId).n;
  const jobCount = sqlite.prepare("SELECT COUNT(*) AS n FROM scheduled_jobs").get().n;

  report.destinationCounts = {
    main: kvMain,
    custom: kvCustom,
    legacy: legacyCount,
    jobs: jobCount,
    cooldowns: report.cooldowns,
  };
  report.archived = archived;

  const totalSource = sourceCounts.main + sourceCounts.custom + sourceCounts.__aoijs_vars__;
  if (legacyCount !== totalSource) {
    sqlite.close();
    throw new MigrationError(`Archive count mismatch: expected ${totalSource}, got ${legacyCount}`);
  }
  if (kvMain !== sourceCounts.main || kvCustom !== sourceCounts.custom) {
    sqlite.close();
    throw new MigrationError("kv count mismatch after import");
  }

  // Verify each imported value, not just record counts.
  const read = sqlite.prepare("SELECT value_json FROM kv WHERE namespace=? AND key=?");
  for (const table of ["main", "custom"]) for (const record of exportData[table].values()) {
    if (read.get(table, record.key)?.value_json !== serializeValue(record.value)) throw new MigrationError(`Value mismatch: ${table}/${record.key}`);
  }
  if (sqlite.pragma("integrity_check", { simple: true }) !== "ok") throw new MigrationError("SQLite integrity check failed");
  sqlite.pragma("wal_checkpoint(TRUNCATE)");
  sqlite.close();
  if (allowExisting) fs.renameSync(temporary, destinationPath);
  else { fs.linkSync(temporary, destinationPath); fs.unlinkSync(temporary); }
  return report;
  } finally {
    if (sqlite.open) sqlite.close();
    for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(`${temporary}${suffix}`, { force: true });
  }
}

module.exports = { migrate, decodeTimeout, decodeCooldown, KNOWN_TIMEOUT_TYPES, MigrationError, importIdFor };
