"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

/**
 * Reads aoi.db KeyValue scheme files directly (the same format `@aoijs/aoi.db`
 * uses) and produces a deterministic neutral export.
 *
 * The source directory is always treated as read-only.
 */

const SCHEME_RE = /_scheme_\d+\.sql$/;

function listSchemeFiles(tableDir) {
  if (!fs.existsSync(tableDir)) return [];
  return fs
    .readdirSync(tableDir)
    .filter((name) => SCHEME_RE.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/_scheme_(\d+)\.sql$/)?.[1] ?? 0);
      const nb = Number(b.match(/_scheme_(\d+)\.sql$/)?.[1] ?? 0);
      return na - nb;
    });
}

/** Reads one table directory into a Map<rawKey, { value, type, key }>. */
function readTable(tableDir) {
  const records = new Map();
  for (const file of listSchemeFiles(tableDir)) {
    const raw = fs.readFileSync(path.join(tableDir, file), "utf8").trim();
    if (!raw) continue;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Failed to parse ${path.join(tableDir, file)}: ${error.message}`);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`Invalid scheme object: ${file}`);
    for (const [rawKey, record] of Object.entries(parsed)) {
      if (!record || typeof record !== "object" || !("value" in record)) throw new Error(`Invalid record: ${file}/${rawKey}`);
      records.set(rawKey, {
        key: record.key ?? rawKey,
        value: record.value,
        type: record.type ?? typeof record.value,
      });
    }
  }
  return records;
}

function readDatabase(dbPath) {
  const tables = ["main", "custom", "__aoijs_vars__"];
  const result = {};
  for (const table of tables) {
    result[table] = readTable(path.join(dbPath, table));
  }
  return result;
}

/** Deterministic checksum over sorted records (table, key, type, value). */
function checksum(exportData) {
  const hash = crypto.createHash("sha256");
  for (const table of Object.keys(exportData).sort()) {
    const records = [...exportData[table].values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    for (const record of records) {
      hash.update(`${table}\u0000${record.key}\u0000${record.type}\u0000${JSON.stringify(record.value)}\n`);
    }
  }
  return hash.digest("hex");
}

function counts(exportData) {
  const out = {};
  for (const table of Object.keys(exportData)) out[table] = exportData[table].size;
  return out;
}

module.exports = { readDatabase, readTable, listSchemeFiles, checksum, counts, SCHEME_RE };
