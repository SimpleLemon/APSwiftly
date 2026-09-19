"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Collection } = require("discord.js");

const { createBot } = require("../src/client");
const { Context } = require("../src/context");
const { ComponentContext } = require("../src/routers/interactions");

const AVATAR = "https://cdn.discordapp.com/avatars/1/a.png";

function makeUser(id = "u1") {
  return {
    id,
    username: `User${id}`,
    bot: false,
    tag: "User#0",
    displayAvatarURL: () => AVATAR,
    avatarURL: () => AVATAR,
    bannerURL: () => AVATAR,
    defaultAvatarURL: AVATAR,
    send: async () => {},
    createdTimestamp: Date.now(),
    flags: { has: () => false },
  };
}

function makeChannel(id = "c1") {
  return {
    id,
    name: "general",
    parentId: null,
    type: 0,
    isTextBased: () => true,
    toString: () => `<#${id}>`,
    send: async () => ({ id: "m-sent", edit: async () => {}, react: async () => {}, delete: async () => {}, components: [], embeds: [] }),
    permissionsFor: () => ({ has: () => true }),
    messages: { fetch: async () => null },
    awaitMessages: async () => ({ first: () => null }),
    createMessageCollector: () => ({ on() {}, stop() {} }),
  };
}

function makeGuild(guildId = "g1") {
  const channel = makeChannel();
  const member = {
    id: "u1",
    permissions: { has: () => true },
    roles: { cache: new Collection([["1519016533005832332", {}]]) },
    displayName: "User",
    user: makeUser(),
    joinedTimestamp: Date.now(),
  };
  const membersColl = new Collection([["u1", member]]);
  const guild = {
    id: guildId,
    name: "Guild",
    memberCount: 5,
    ownerId: "o1",
    channels: { cache: new Collection([["c1", channel]]), fetch: async () => channel },
    roles: { cache: new Collection() },
    emojis: { cache: new Collection() },
    members: { cache: membersColl, me: member, fetchMe: async () => member, fetch: async () => membersColl, resolve: () => member },
    iconURL: () => null,
    icon: null,
    description: "desc",
    premiumSubscriptionCount: 0,
    premiumTier: 0,
    verificationLevel: 0,
    createdTimestamp: Date.now(),
    fetchAuditLogs: async () => ({ entries: new Collection() }),
    fetchOwner: async () => makeUser("o1"),
  };
  return { guild, channel, member };
}

function makeMessage(guildId = "g1") {
  const { guild, channel, member } = makeGuild(guildId);
  return {
    id: "m1",
    content: "test",
    guildId,
    channelId: "c1",
    url: "https://discord.com/channels/g1/c1/m1",
    createdTimestamp: Date.now(),
    guild,
    channel,
    member,
    author: makeUser(),
    mentions: { users: new Collection(), members: new Collection() },
    reply: async () => ({ id: "m-reply", edit: async () => {}, react: async () => {} }),
    delete: async () => {},
    react: async () => {},
    attachments: new Collection(),
    fetch: async () => makeMessage(guildId),
  };
}

function makeClient() {
  const client = createBot({ connect: false, sqlitePath: ":memory:", logger: { error() {}, warn() {}, log() {}, debug() {}, child() { return this; } } });
  client.user = {
    id: "bot1",
    username: "APSwiftly",
    tag: "APSwiftly#0",
    displayAvatarURL: () => AVATAR,
    defaultAvatarURL: AVATAR,
  };
  client.users = { cache: new Collection(), fetch: async () => makeUser("o1") };
  client.generateInvite = async () => "https://discord.com/oauth2/authorize?client_id=bot1";
  return client;
}

const NETWORK_COMMANDS = new Set([
  "eval", "jseval", "execute", "exec", "readfile", "serverlist", "update", "reload", "refreshslash",
  "shutdown", "terminal", "acreate", "ai", "latex", "webscreenshot", "randomcolor", "reverse", "mock",
  "fact", "joke", "comment", "ad", "clown", "drip", "gun", "invert", "jail", "nokia", "wanted",
  "whereiseveryone", "2048", "connect4", "coinflip", "findemoji", "flood", "findtheflag",
  "guess-the-pokemon", "hangman", "match-pairs", "minesweeper", "rock-paper-scissors", "snake",
  "tictactoe", "trivia", "wordle", "would-you-rather", "remind", "poll", "suggest", "checkin",
  "contributor", "marketing", "archive", "join",
  // Slow by design or network-bound: ping waits 3s (legacy $editIn[3s]), lulcat calls an API,
  // whoasked/whereiseveryone schedule edit timers up to 35s (legacy $editIn).
  "ping", "lulcat", "whoasked", "whereiseveryone",
]);

test("a broad sample of prefix handlers executes against a faithful mock", async () => {
  const client = makeClient();
  const failures = [];
  let ran = 0;

  for (const def of client.registry.prefixCommands.values()) {
    if (def.ownerOnly || NETWORK_COMMANDS.has(def.name)) continue;
    const ctx = new Context({ client, command: def, args: ["test"], message: makeMessage() });
    try {
      const result = def.execute(ctx);
      if (result && typeof result.then === "function") await result;
      ran++;
    } catch (error) {
      failures.push(`${def.name}: ${error.message}`);
    }
  }

  assert.ok(ran > 30, `only executed ${ran} handlers`);
  assert.deepEqual(failures, []);
  client.sqlite.close();
});

test("invite and say resolve generateInvite as a promise", async () => {
  const client = makeClient();
  for (const name of ["invite", "say"]) {
    const def = client.registry.resolvePrefix(name);
    const ctx = new Context({ client, command: def, args: ["hello"], message: makeMessage() });
    await assert.doesNotReject(def.execute(ctx), `${name} rejected`);
  }
  client.sqlite.close();
});

test("slash handlers execute against a faithful mock", async () => {
  const client = makeClient();
  const failures = [];

  const makeInteraction = (name, options = {}) => {
    const { guild, channel, member } = makeGuild();
    return {
      commandName: name,
      user: makeUser(),
      member,
      guild,
      channel,
      options: { getUser: () => makeUser("u2"), getString: () => "test", getNumber: () => 1, getInteger: () => 1, _hoistedOptions: [], _subcommand: undefined, _group: undefined },
      deferred: false,
      replied: false,
      isChatInputCommand: () => true,
      isContextMenuCommand: () => false,
      isButton: () => false,
      isAnySelectMenu: () => false,
      isModalSubmit: () => false,
      reply: async () => {},
      deferReply: async () => {},
      editReply: async () => {},
      followUp: async () => {},
      update: async () => {},
      ...options,
    };
  };

  for (const [name, def] of client.registry.slashCommands.entries()) {
    const skip = new Set(["ai", "terminal", "reload", "addhours", "ban", "kick", "contributor", "noreply", "denied", "senddm", "latex", "ping"]);
    if (skip.has(name)) continue;
    const ctx = new ComponentContext({ client, interaction: makeInteraction(name), def });
    ctx.options = makeInteraction(name).options;
    try {
      const result = def.execute(ctx);
      if (result && typeof result.then === "function") await result;
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    }
  }

  assert.deepEqual(failures, []);
  client.sqlite.close();
});
