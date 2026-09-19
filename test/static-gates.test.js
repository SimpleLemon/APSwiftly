"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const { walk } = require("../src/migration/parity");

function runtimeFiles() {
  return [
    ...walk(path.join(ROOT, "commands")),
    ...walk(path.join(ROOT, "src")).filter((file) => !file.includes(`${path.sep}migration${path.sep}`)),
    path.join(ROOT, "index.js"),
  ];
}

test("no runtime file contains aoi DSL", () => {
  const offenders = [];
  const dslPattern = /\$(onlyIf|getGuildVar|setGuildVar|getUserVar|setUserVar|getGlobalUserVar|setGlobalUserVar|getChannelVar|setChannelVar|interactionReply|interactionUpdate|interactionFollowUp|createApplicationCommand|deleteApplicationCommand|alwaysExecute|sendMessage|setTimeout|stopTimeout|slashOption|newEmbed|actionRow|addField|addButton|addSelectMenu|djsEval|awaitExecute|ifAwaited)\b/;
  for (const file of runtimeFiles()) {
    const source = fs.readFileSync(file, "utf8");
    // Ignore mentions inside comments and string-literal documentation only;
    // any real DSL usage is a gate failure.
    const stripped = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    if (dslPattern.test(stripped)) {
      offenders.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(offenders, []);
});

test("no runtime file requires aoi.js or @aoijs/aoi.db", () => {
  const offenders = [];
  for (const file of runtimeFiles()) {
    const source = fs.readFileSync(file, "utf8");
    if (/require\(\s*["']aoi\.js["']\s*\)/.test(source) || /require\(\s*["']@aoijs\/aoi\.db["']\s*\)/.test(source)) {
      offenders.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(offenders, []);
});

test("every runtime module loads without throwing", () => {
  const failures = [];
  for (const file of runtimeFiles()) {
    if (file.endsWith("index.js") && file === path.join(ROOT, "index.js")) continue;
    try {
      require(file);
    } catch (error) {
      failures.push(`${path.relative(ROOT, file)}: ${error.message}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("application starts far enough to load all modules in validation mode", () => {
  const { createBot } = require("../src/client");
  const client = createBot({
    connect: false,
    sqlitePath: ":memory:",
    logger: { error() {}, warn() {}, log() {}, debug() {}, child() { return this; } },
  });
  const stats = client.registry.stats();
  assert.equal(stats.errors.length, 0);
  assert.ok(stats.total > 200);
  client.sqlite.close();
});

test("package.json has no aoi runtime dependencies", () => {
  const pkg = require("../package.json");
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.equal(deps["aoi.js"], undefined);
  assert.equal(deps["@aoijs/aoi.db"], undefined);
  assert.ok(deps["discord.js"], "discord.js must be an explicit dependency");
  assert.ok(deps["better-sqlite3"], "better-sqlite3 must be a dependency");
});

test("parity manifest is tracked and complete", () => {
  const manifestPath = path.join(ROOT, "migration", "parity-manifest.json");
  assert.ok(fs.existsSync(manifestPath), "parity manifest must be tracked");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.ok(manifest.totalDefinitions >= 329, `expected >= 329 definitions, got ${manifest.totalDefinitions}`);
  assert.equal(manifest.definitions.length, manifest.totalDefinitions);
});

test("gitignore excludes migration artifacts and the SQLite database", () => {
  const gitignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
  assert.match(gitignore, /\.migration\//);
  assert.match(gitignore, /database\//);
  assert.match(gitignore, /\.env/);
});

test("config resolves without a config.json file", () => {
  const { loadConfig, DEFAULT_CONFIG } = require("../src/config");
  const config = loadConfig();
  assert.equal(typeof config.prefix, "string");
  assert.ok(config.SQLITE_PATH);
  assert.ok(config.Embedcolor || DEFAULT_CONFIG.Embedcolor);
});
