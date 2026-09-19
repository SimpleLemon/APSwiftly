"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { readDatabase, checksum, counts } = require("../src/migration/aoiReader");
const { migrate, decodeTimeout, decodeCooldown, MigrationError } = require("../src/migration/migrate");
const { openDatabase, deserializeValue } = require("../src/db/database");

const PROD = path.join(__dirname, "..", ".migration", "production", "apswiftly");

function tempDb(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apswiftly-test-"));
  return { dir, file: path.join(dir, name) };
}

test("production snapshot migrates with matching counts and checksum", (t) => {
  if (!fs.existsSync(PROD)) {
    t.skip("production snapshot not present");
    return;
  }

  const { dir, file } = tempDb("prod.sqlite");
  const report = migrate({ sourcePath: PROD, destinationPath: file, logger: { error() {} } });

  const source = readDatabase(PROD);
  assert.equal(report.destinationCounts.main, counts(source).main);
  assert.equal(report.destinationCounts.custom, counts(source).custom);
  assert.equal(report.destinationCounts.legacy, counts(source).main + counts(source).custom + counts(source).__aoijs_vars__);
  assert.equal(report.sourceChecksum, checksum(source));

  fs.rmSync(dir, { recursive: true, force: true });
});

test("main and custom key/values migrate without loss", (t) => {
  if (!fs.existsSync(PROD)) {
    t.skip("production snapshot not present");
    return;
  }
  const { dir, file } = tempDb("lossless.sqlite");
  migrate({ sourcePath: PROD, destinationPath: file, logger: { error() {} } });

  const source = readDatabase(PROD);
  const db = openDatabase(file);
  let checked = 0;
  for (const table of ["main", "custom"]) {
    for (const record of source[table].values()) {
      const row = db.prepare("SELECT value_json FROM kv WHERE namespace = ? AND key = ?").get(table, record.key);
      assert.ok(row, `missing ${table}/${record.key}`);
      assert.deepEqual(deserializeValue(row.value_json), record.value, `value mismatch ${table}/${record.key}`);
      checked++;
    }
  }
  assert.ok(checked > 0);
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("migration is deterministic (repeatable checksum)", (t) => {
  if (!fs.existsSync(PROD)) {
    t.skip("production snapshot not present");
    return;
  }
  const a = tempDb("a.sqlite");
  const b = tempDb("b.sqlite");
  const first = migrate({ sourcePath: PROD, destinationPath: a.file, logger: { error() {} } });
  const second = migrate({ sourcePath: PROD, destinationPath: b.file, logger: { error() {} } });
  assert.equal(first.sourceChecksum, second.sourceChecksum);
  assert.equal(first.importId, second.importId);
  fs.rmSync(a.dir, { recursive: true, force: true });
  fs.rmSync(b.dir, { recursive: true, force: true });
});

test("migration refuses to overwrite an existing destination by default", (t) => {
  if (!fs.existsSync(PROD)) {
    t.skip("production snapshot not present");
    return;
  }
  const { dir, file } = tempDb("existing.sqlite");
  migrate({ sourcePath: PROD, destinationPath: file, logger: { error() {} } });
  assert.throws(() => migrate({ sourcePath: PROD, destinationPath: file, logger: { error() {} }, allowExisting: false }), MigrationError);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("unknown internal records are archived in legacy_aoi_records", () => {
  const source = fs.mkdtempSync(path.join(os.tmpdir(), "aoi-src-"));
  fs.mkdirSync(path.join(source, "main"));
  fs.mkdirSync(path.join(source, "custom"));
  fs.mkdirSync(path.join(source, "__aoijs_vars__"));
  fs.writeFileSync(
    path.join(source, "main", "main_scheme_1.sql"),
    JSON.stringify({ prefix_g1: { value: "!", type: "string", key: "prefix_g1" } })
  );
  fs.writeFileSync(
    path.join(source, "__aoijs_vars__", "__aoijs_vars___scheme_1.sql"),
    JSON.stringify({ weird_internal: { value: "keepme", type: "string", key: "weird_internal" } })
  );

  const { dir, file } = tempDb("archive.sqlite");
  migrate({ sourcePath: source, destinationPath: file, logger: { error() {} } });

  const db = openDatabase(file);
  const row = db.prepare("SELECT * FROM legacy_aoi_records WHERE raw_key = ?").get("weird_internal");
  assert.ok(row);
  assert.equal(row.source_table, "__aoijs_vars__");
  assert.equal(deserializeValue(row.value_json), "keepme");
  db.close();

  fs.rmSync(source, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

test("unknown ACTIVE timeout types fail verification", () => {
  const source = fs.mkdtempSync(path.join(os.tmpdir(), "aoi-src-"));
  fs.mkdirSync(path.join(source, "main"));
  fs.mkdirSync(path.join(source, "custom"));
  fs.mkdirSync(path.join(source, "__aoijs_vars__"));
  fs.writeFileSync(
    path.join(source, "__aoijs_vars__", "__aoijs_vars___scheme_1.sql"),
    JSON.stringify({
      setTimeout_1: {
        value: { __timeoutName__: "mysteryJob", __id__: 1, __duration__: Date.now() + 1000, foo: "bar" },
        type: "object",
        key: "setTimeout_1",
      },
    })
  );

  const { dir, file } = tempDb("unknown.sqlite");
  assert.throws(
    () => migrate({ sourcePath: source, destinationPath: file, logger: { error() {} } }),
    /unknown active timeout/
  );

  fs.rmSync(source, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

test("known timeouts become scheduler jobs and cooldowns import", () => {
  const source = fs.mkdtempSync(path.join(os.tmpdir(), "aoi-src-"));
  fs.mkdirSync(path.join(source, "main"));
  fs.mkdirSync(path.join(source, "custom"));
  fs.mkdirSync(path.join(source, "__aoijs_vars__"));
  fs.writeFileSync(
    path.join(source, "__aoijs_vars__", "__aoijs_vars___scheme_1.sql"),
    JSON.stringify({
      setTimeout_55: {
        value: { __timeoutName__: "remi", __id__: 55, __duration__: Date.now() + 60000, link: "x", msg: "hi", author: "1" },
        type: "object",
        key: "setTimeout_55",
      },
      cooldown_ping_123_456: { value: Date.now() + 30000, type: "number", key: "cooldown_ping_123_456" },
    })
  );

  const { dir, file } = tempDb("jobs.sqlite");
  const report = migrate({ sourcePath: source, destinationPath: file, logger: { error() {} } });
  assert.equal(report.jobs.length, 1);
  assert.equal(report.cooldowns, 1);

  const db = openDatabase(file);
  const job = db.prepare("SELECT * FROM scheduled_jobs WHERE id = ?").get("55");
  assert.equal(job.type, "remi");
  const cooldown = db.prepare("SELECT * FROM cooldowns WHERE key = ?").get("ping_123_456");
  assert.ok(cooldown);
  db.close();

  fs.rmSync(source, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

test("decodeTimeout / decodeCooldown helpers", () => {
  const timeout = decodeTimeout({ value: { __timeoutName__: "remi", __id__: 7, __duration__: 123, msg: "x" } });
  assert.deepEqual(timeout, { id: "7", type: "remi", executeAt: 123, payload: { msg: "x" } });

  const cooldown = decodeCooldown("cooldown_my_cmd_999_guild", 456);
  assert.deepEqual(cooldown, { commandName: "my_cmd", userId: "999", guildId: "guild", expiresAt: 456 });
});

test("CLI overwrite is opt-in and rejects unknown arguments", () => {
  const { parseArgs } = require("../migration/migrate-aoi-to-sqlite");
  assert.equal(parseArgs([]).allowExisting,false);
  assert.equal(parseArgs(["--allow-existing"]).allowExisting,true);
  assert.throws(()=>parseArgs(["--allow-exsting"]),/Unknown/);
});

test("malformed sources cannot replace an existing destination", () => {
  const source=fs.mkdtempSync(path.join(os.tmpdir(),"bad-aoi-"));
  const target=tempDb("protected.sqlite");
  try {
    fs.writeFileSync(target.file,"preserve me");
    assert.throws(()=>migrate({sourcePath:source,destinationPath:target.file,allowExisting:true}),/Missing source table/);
    for(const table of ["main","custom","__aoijs_vars__"])fs.mkdirSync(path.join(source,table));
    fs.writeFileSync(path.join(source,"main","main_scheme_1.sql"),"not JSON");
    assert.throws(()=>migrate({sourcePath:source,destinationPath:target.file,allowExisting:true}),/Failed to parse/);
    assert.equal(fs.readFileSync(target.file,"utf8"),"preserve me");
  } finally { fs.rmSync(source,{recursive:true,force:true});fs.rmSync(target.dir,{recursive:true,force:true}); }
});
