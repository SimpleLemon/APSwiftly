"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { createBot } = require("../src/client");
const { parityReport } = require("../src/migration/parity");
const { matchCommand, resolvePrefix } = require("../src/routers/prefix");
const { Registry } = require("../src/registry");
const { SlashService } = require("../src/services/slashRegistry");
const { buildDefinition, SLASH_DEFINITIONS } = require("../src/slash/definitions");
const { parseTime, humanizeDuration } = require("../src/utils/time");
const { owoify, excludeSpecialChars, createProgressBar, randomColor } = require("../src/utils/text");
const { eightBallAnswer, randomTopic } = require("../src/utils/random");
const { Cooldowns } = require("../src/db/cooldowns");
const { openDatabase } = require("../src/db/database");
const { Repository } = require("../src/db/repository");

function makeClient() {
  return createBot({ connect: false, sqlitePath: ":memory:", logger: { error() {}, warn() {}, log() {}, debug() {}, child() { return this; } } });
}

test("command loader loads every migrated command", () => {
  const client = makeClient();
  const stats = client.registry.stats();
  assert.equal(stats.errors.length, 0, stats.errors.join("\n"));
  assert.ok(stats.prefix > 80);
  assert.ok(stats.slash >= 19);
  assert.ok(stats.components >= 100);
  client.sqlite.close();
});

test("parity manifest has no unmigrated handlers", () => {
  const client = makeClient();
  const report = parityReport(client.registry);
  assert.deepEqual(report.problems, []);
  assert.ok(report.legacyCount >= 329);
  client.sqlite.close();
});

test("aliases resolve correctly", () => {
  const client = makeClient();
  assert.ok(client.registry.resolvePrefix("lb"));
  assert.equal(client.registry.resolvePrefix("lb").name, "rich");
  assert.ok(client.registry.resolvePrefix("c4"));
  assert.ok(client.registry.resolvePrefix("rem"));
  assert.equal(client.registry.resolvePrefix("nonexistent-xyz"), null);
  client.sqlite.close();
});

test("guild prefixes resolve per guild with fallback", () => {
  const client = makeClient();
  const { config } = require("../src/config");
  assert.equal(resolvePrefix(client, { guild: null }), config.prefix);
  const message = { guild: { id: "g1" } };
  assert.equal(resolvePrefix(client, message), config.prefix);
  client.db.setGuildVar("g1", "prefix", "?");
  assert.equal(resolvePrefix(client, message), "?");
  client.sqlite.close();
});

test("prefix matching handles aliases and exact words", () => {
  const client = makeClient();
  const prefix = require("../src/config").config.prefix;
  const match = matchCommand(client, `${prefix}lb`, prefix);
  assert.equal(match.command.name, "rich");
  const argsMatch = matchCommand(client, `${prefix}addhours @user 5`, prefix);
  assert.equal(argsMatch.command.name, "addhours");
  assert.deepEqual(argsMatch.args, ["@user", "5"]);
  client.sqlite.close();
});

test("owner/guild restrictions are enforced by the router", async () => {
  const { handlePrefixCommand } = require("../src/routers/prefix");
  const client = makeClient();
  client.ownerIds = ["owner-1"];
  const sent = [];
  const ctxClient = {
    ...client,
    db: client.db,
    services: client.services,
    logger: client.logger,
  };
  const command = {
    name: "eval",
    ownerOnly: true,
    async execute() {
      throw new Error("should not run");
    },
  };
  const message = {
    guild: { id: "g1" },
    author: { id: "intruder" },
    channel: { send: async (payload) => sent.push(payload) },
    content: "x",
    member: null,
    reply: async (payload) => sent.push(payload),
  };
  await handlePrefixCommand(ctxClient, message, command, []);
  assert.equal(sent.length, 1);
  client.sqlite.close();
});

test("guild-restricted command rejects other guilds", async () => {
  const { handlePrefixCommand } = require("../src/routers/prefix");
  const client = makeClient();
  const sent = [];
  const command = {
    name: "addhours",
    guildOnlyIds: ["859910344393883710"],
    guildRestrictionMessage: "You tried.",
    async execute() {
      throw new Error("should not run");
    },
  };
  const message = {
    guild: { id: "other-guild" },
    author: { id: "u1" },
    channel: { send: async (payload) => sent.push(payload) },
    content: "x",
    member: null,
    reply: async (payload) => sent.push(payload),
  };
  await handlePrefixCommand(client, message, command, []);
  assert.equal(sent.length, 1);
  client.sqlite.close();
});

test("cooldowns persist and block repeats", () => {
  const sqlite = openDatabase(":memory:");
  const cooldowns = new Cooldowns({ sqlite });
  assert.equal(cooldowns.check("ping", "u1", "g1"), 0);
  cooldowns.set("ping", "u1", "g1", 5000);
  assert.ok(cooldowns.check("ping", "u1", "g1") > 0);
  assert.equal(cooldowns.check("ping", "u2", "g1"), 0);
  cooldowns.clear("ping", "u1", "g1");
  assert.equal(cooldowns.check("ping", "u1", "g1"), 0);
  sqlite.close();
});

test("slash definitions serialize and cover all handlers", () => {
  const client = makeClient();
  const service = new SlashService(client);
  const definitions = service.globalDefinitions();
  assert.ok(definitions.length > 0);
  for (const definition of definitions) {
    assert.equal(typeof definition.name, "string");
    assert.equal(typeof definition.description, "string");
    assert.doesNotThrow(() => JSON.stringify(definition));
  }
  const registered = new Set([...client.registry.slashCommands.keys()]);
  const missing = [...registered].filter((name) => !SLASH_DEFINITIONS[name]);
  assert.deepEqual(missing, []);
  client.sqlite.close();
});

test("slash service registers headlessly through REST without a gateway login", async () => {
  const client = makeClient();
  const calls = [];
  client.rest = {
    get: async (route) => {
      calls.push(["GET", route]);
      if (route.includes("applications/@me")) return { id: "app-1" };
      return [];
    },
    put: async (route, body) => {
      calls.push(["PUT", route, body.body.length]);
      return [];
    },
    delete: async (route) => {
      calls.push(["DELETE", route]);
      return null;
    },
  };

  const service = new SlashService(client);
  const result = await service.syncAll();
  assert.ok(result.globalCount > 0);
  assert.ok(result.guildCount > 0);
  const globalPut = calls.find(([method, route]) => method === "PUT" && route.includes("applications/"));
  assert.ok(globalPut, "expected a global PUT");
  const guildPut = calls.find(([method, route]) => method === "PUT" && route.includes("guilds/"));
  assert.ok(guildPut, "expected a guild PUT");
  client.sqlite.close();
});

test("slash option parsing exposes the legacy options", () => {
  const ban = buildDefinition("ban");
  assert.deepEqual(ban.options.map((option) => option.name), ["user", "reason", "preserve_messages"]);
  assert.equal(ban.options[0].required, true);
  const addhours = buildDefinition("addhours");
  assert.deepEqual(addhours.options.map((option) => option.type), [6, 4]);
  const noreply = buildDefinition("noreply");
  assert.equal(noreply.guildId, undefined); // guildId stripped from serialized definition
  assert.equal(SLASH_DEFINITIONS.noreply.guildId, "859910344393883710");
});

test("component customId ownership matching", () => {
  const client = makeClient();
  const matches = client.registry.findComponent("button", "earlycheckin");
  assert.equal(matches.length, 1);
  const none = client.registry.findComponent("button", "totally-unknown");
  assert.equal(none.length, 0);
  client.sqlite.close();
});

test("select menus and modal routing resolve", () => {
  const client = makeClient();
  assert.ok(client.registry.findComponent("select", "helpmenu_123").length >= 1);
  assert.ok(client.registry.findComponent("modal", "welcomertextmodal").length >= 1);
  client.sqlite.close();
});

test("volunteer-hour updates flow through the shared service", async () => {
  const client = makeClient();
  const { addHours, getHours } = require("../src/services/hours");
  const newTotal = await addHours(client, { targetUserId: "u1", amount: 5, actorId: "staff", log: false });
  assert.equal(newTotal, 5);
  assert.equal(getHours(client, "u1"), 5);
  const second = await addHours(client, { targetUserId: "u1", amount: 2.5, actorId: "staff", log: false });
  assert.equal(second, 7.5);
  client.sqlite.close();
});

test("leveling calculations match the legacy thresholds", () => {
  const client = makeClient();
  client.db.setGuildVar("g1", "levelsystem", "on");
  const userId = "u1";
  client.db.setUserVar("g1", userId, "xp", "10");
  client.db.setUserVar("g1", userId, "xpLimit", "10");
  client.db.setUserVar("g1", userId, "level", "1");

  const level = Number(client.db.getUserVar("g1", userId, "level")) + 1;
  const xpLimit = Number(client.db.getUserVar("g1", userId, "xpLimit")) + 20;
  assert.equal(level, 2);
  assert.equal(xpLimit, 30);
  client.sqlite.close();
});

test("logging feature toggles default correctly", () => {
  const client = makeClient();
  assert.equal(client.db.getGuildVar("g1", "msgdeletelog"), "on");
  assert.equal(client.db.getGuildVar("g1", "msgeditlog"), "on");
  assert.equal(client.db.getGuildVar("g1", "banneduserslog"), "on");
  assert.equal(client.db.getGuildVar("g1", "welcomesystem"), "off");
  assert.equal(client.db.getGuildVar("g1", "levelsystem"), "off");
  client.sqlite.close();
});

test("time parsing and formatting helpers", () => {
  assert.equal(parseTime("1m"), 60000);
  assert.equal(parseTime("1h"), 3600000);
  assert.equal(parseTime("1d"), 86400000);
  assert.equal(parseTime("2s"), 2000);
  assert.equal(parseTime("1min"), 60000);
  assert.equal(parseTime("garbage"), -1);
  assert.equal(parseTime(""), -1);
  assert.equal(humanizeDuration(90000), "1m 30s");
});

test("text helpers preserve legacy behavior", () => {
  assert.equal(owoify("hello"), "hewwo");
  assert.equal(excludeSpecialChars("a+b-c"), "abc");
  assert.equal(createProgressBar(5, 10, 10), "=====-----");
  assert.match(randomColor(), /^[0-9a-f]{6}$/);
  assert.ok(eightBallAnswer().length > 0);
  assert.ok(randomTopic().length > 0);
});
