"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { openDatabase, serializeValue, deserializeValue, typeOf } = require("../src/db/database");
const { Repository } = require("../src/db/repository");
const { getDefault, parseByType } = require("../src/db/defaults");

function freshRepo() {
  const sqlite = openDatabase(":memory:");
  return { sqlite, repo: new Repository(sqlite) };
}

test("rawKey construction matches aoi.js", () => {
  assert.equal(Repository.rawKey("hours", null), "hours");
  assert.equal(Repository.rawKey("hours", "123"), "hours_123");
  assert.equal(Repository.rawKey("xp", "u_g"), "xp_u_g");
});

test("global var get/set/delete with default fallback", () => {
  const { sqlite, repo } = freshRepo();
  assert.equal(repo.getVar("version"), require("../package.json").version);
  repo.setVar("version", "9.9.9");
  assert.equal(repo.getVar("version"), "9.9.9");
  repo.deleteVar("version");
  assert.equal(repo.getVar("version"), require("../package.json").version);
  sqlite.close();
});

test("guild, guild-user, global-user, channel and message scopes", () => {
  const { sqlite, repo } = freshRepo();

  repo.setGuildVar("g1", "prefix", "?");
  assert.equal(repo.getGuildVar("g1", "prefix"), "?");
  assert.equal(repo.getGuildVar("g2", "prefix"), require("../src/config").config.prefix);

  repo.setUserVar("g1", "u1", "xp", "42");
  assert.equal(repo.getUserVar("g1", "u1", "xp"), "42");
  assert.equal(repo.getUserVar("g1", "u2", "xp"), "0");

  repo.setGlobalUserVar("u1", "hours", "12", "custom");
  assert.equal(repo.getGlobalUserVar("u1", "hours", "custom"), "12");
  assert.equal(repo.getGlobalUserVar("u2", "hours", "custom"), "0");

  repo.setChannelVar("c1", "checkinid", "m1", "custom");
  assert.equal(repo.getChannelVar("c1", "checkinid", "custom"), "m1");

  repo.setMessageVar("m1", "flag", "yes");
  assert.equal(repo.getMessageVar("m1", "flag"), "yes");

  sqlite.close();
});

test("stored empty string, 0 and false are not treated as missing", () => {
  const { sqlite, repo } = freshRepo();
  repo.setChannelVar("c1", "checkinid", "", "custom");
  assert.equal(repo.getChannelVar("c1", "checkinid", "custom"), "");
  assert.equal(repo.hasScoped("custom", "checkinid", "c1"), true);

  repo.setGuildVar("g1", "autopingreply", "off");
  assert.equal(repo.getGuildVar("g1", "autopingreply"), "off");
  sqlite.close();
});

test("numeric defaults coerce string writes", () => {
  const { sqlite, repo } = freshRepo();
  repo.setVar("flood_difficulty", "18");
  assert.equal(repo.getVar("flood_difficulty"), 18);
  assert.equal(typeof repo.getVar("flood_difficulty"), "number");
  sqlite.close();
});

test("object defaults survive JSON round-trip", () => {
  const { sqlite, repo } = freshRepo();
  assert.deepEqual(repo.getVar("wyr"), { upvotes: 0, downvotes: 0 });
  repo.setVar("wyr", { upvotes: 5, downvotes: 2 });
  assert.deepEqual(repo.getVar("wyr"), { upvotes: 5, downvotes: 2 });
  sqlite.close();
});

test("resetGuildUserVars removes only guild-user records", () => {
  const { sqlite, repo } = freshRepo();
  repo.setUserVar("g1", "u1", "level", "5");
  repo.setUserVar("g1", "u2", "level", "6");
  repo.setUserVar("g2", "u1", "level", "7");
  repo.setGlobalUserVar("u1", "level", "8", "main");

  const removed = repo.resetGuildUserVars("g1", "level");
  assert.equal(removed, 2);
  assert.equal(repo.getUserVar("g1", "u1", "level"), "1");
  assert.equal(repo.getUserVar("g2", "u1", "level"), "7");
  sqlite.close();
});

test("listGlobalUserVars sorts numerically and ignores guild-user keys", () => {
  const { sqlite, repo } = freshRepo();
  repo.setGlobalUserVar("u1", "hours", "5", "custom");
  repo.setGlobalUserVar("u2", "hours", "50", "custom");
  repo.setGlobalUserVar("u3", "hours", "9", "custom");
  repo.setUserVar("g1", "u4", "hours", "100", "custom");

  const list = repo.listGlobalUserVars("hours", "custom", "desc", 10);
  assert.deepEqual(list.map((entry) => entry.id), ["u2", "u3", "u1"]);
  assert.deepEqual(list.map((entry) => entry.value), [50, 9, 5]);
  sqlite.close();
});

test("typeOf and serialize round-trip", () => {
  for (const value of ["", "text", 0, 5, true, false, null, { a: 1 }, [1, 2]]) {
    assert.deepEqual(deserializeValue(serializeValue(value)), value);
  }
  assert.equal(typeOf(1), "number");
  assert.equal(typeOf("x"), "string");
  assert.equal(typeOf([]), "array");
});

test("parseByType mirrors aoi.js VariableManager.parseData", () => {
  assert.equal(parseByType("5", 0), 5);
  assert.equal(parseByType("x", 0), "x");
  assert.deepEqual(parseByType('{"a":1}', {}), { a: 1 });
  assert.equal(parseByType("hello", "default"), "hello");
});

test("transaction rollback leaves kv unchanged", () => {
  const { sqlite, repo } = freshRepo();
  repo.setVar("prefix", "!");
  const tx = sqlite.transaction(() => {
    repo.setVar("prefix", "?");
    throw new Error("boom");
  });
  assert.throws(() => tx());
  assert.equal(repo.getVar("prefix"), "!");
  sqlite.close();
});

test("defaults exist for every seeded variable", () => {
  const { config } = require("../src/config");
  assert.equal(getDefault("main", "prefix"), config.prefix);
  assert.equal(getDefault("custom", "hours"), "0");
  assert.equal(getDefault("main", "nonexistent"), undefined);
});

test("database uses durable synchronous commits for check-in send claims", () => {
  const sqlite = openDatabase(":memory:");
  assert.equal(sqlite.pragma("synchronous", { simple: true }), 2);
  sqlite.close();
});
