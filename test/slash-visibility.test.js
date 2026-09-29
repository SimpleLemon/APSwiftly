"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const { Collection, MessageFlags } = require("discord.js");
const { createBot } = require("../src/client");
const { handleSlash } = require("../src/routers/interactions");
const { GUILD_ID, CATEGORY_ID, STAFF_ROLE_ID } = require("../src/services/checkins");

// Audited against the last pre-migration commit, bcaf5c3. A reply/edit cannot
// change visibility after deferReply, so capture the initial acknowledgement.
const PUBLIC = ["hours", "addhours", "senddm", "noreply", "latex", "terminal", "ai", "echo", "reload"];
const PRIVATE = ["8ball", "avatar", "banner", "invite", "owoify", "reverse", "ping", "ban", "kick", "denied", "contributor", "help"];

function fixture(t, name, { closedDMs = false } = {}) {
  const errors = [];
  const logger = { log() {}, warn() {}, debug() {}, error(...args) { errors.push(args); }, child() { return this; } };
  const client = createBot({ connect: false, sqlitePath: ":memory:", ownerIds: ["owner"], logger });
  t.after(() => {
    client.services.scheduler.stop();
    client.services.checkins.stop();
    client.sqlite.close();
  });
  client.services.errorReporter.report = () => {};
  client.rest.request = async () => { throw new Error("Unexpected network request in visibility test"); };
  client.user = { id: "bot", username: "APSwiftly" };
  client.generateInvite = () => "https://discord.com/oauth2/authorize?client_id=123";
  const messages = [], dms = [], channelMessages = [];
  const target = {
    id: "target", username: "Target",
    displayAvatarURL: () => "https://example.com/avatar.png",
    bannerURL: () => "https://example.com/banner.png",
    async send(payload) {
      if (closedDMs) throw new Error("DMs closed");
      dms.push(payload);
    },
  };
  client.users.fetch = async () => target;
  const channel = {
    id: "channel", parentId: CATEGORY_ID, isTextBased: () => true,
    permissionOverwrites: { edit: async () => {} },
    async send(payload) { channelMessages.push(payload); return { id: "message" }; },
  };
  client.channels.fetch = async () => channel;
  client.services.renderMath = async (_channel, payload) => {
    assert.equal(interaction.deferred, true);
    channelMessages.push(payload);
  };
  const guild = {
    id: GUILD_ID, name: "APStudy", ownerId: "guild-owner",
    channels: { create: async () => channel },
    members: {
      me: { roles: { highest: { position: 10 } } },
      fetch: async () => ({ roles: { highest: { position: 1 } }, kick: async () => {} }),
      ban: async () => {},
    },
  };
  const strings = {
    message: name === "terminal" ? "printf visibility-test" : "Hello world",
    text: "hello", question: "Is this public?", latex: "x^2",
    name: "Target", reason: "Test reason", channelname: "ap-test",
  };
  const interaction = {
    commandName: name, guild, channel,
    user: { id: "owner", username: "Owner", displayAvatarURL: target.displayAvatarURL },
    member: { permissions: { has: () => true }, roles: { highest: { position: 10 }, cache: new Collection([[STAFF_ROLE_ID, {}]]) } },
    options: { getUser: () => target, getInteger: () => 2, getString: key => strings[key] ?? null },
    createdTimestamp: Date.now(), deferred: false, replied: false, ephemeral: null,
    async deferReply(payload) {
      assert.equal(this.replied || this.deferred, false);
      this.ephemeral = Boolean(payload.flags & MessageFlags.Ephemeral);
      this.deferred = true;
    },
    async reply(payload) {
      assert.equal(this.replied || this.deferred, false);
      this.ephemeral = Boolean(payload.flags & MessageFlags.Ephemeral);
      this.replied = true;
      messages.push({ payload, ephemeral: this.ephemeral });
    },
    async editReply(payload) {
      assert.ok(this.deferred || this.replied);
      this.replied = true;
      messages.push({ payload, ephemeral: this.ephemeral });
    },
    async followUp(payload) {
      messages.push({ payload, ephemeral: Boolean(payload.flags & MessageFlags.Ephemeral) });
    },
  };
  t.mock.method(axios, "get", async () => ({ data: { response: "AI answer", usage: { total_tokens: 10 } } }));
  return { client, interaction, messages, errors, dms, channelMessages };
}

for (const [names, ephemeral] of [[PUBLIC, false], [PRIVATE, true]]) {
  for (const name of names) {
    test(`/${name} preserves ${ephemeral ? "private" : "public"} response visibility`, async t => {
      const { client, interaction, messages, errors } = fixture(t, name);
      await handleSlash(client, interaction);
      assert.deepEqual(errors, []);
      assert.ok(messages.length, "command must complete its response");
      assert.ok(messages.every(message => message.ephemeral === ephemeral));
      assert.equal(interaction.ephemeral, ephemeral, "visibility is set at acknowledgement time");
      for (const { payload } of messages) payload.embeds?.forEach(embed => embed.toJSON());
      if (name === "addhours") {
        assert.equal(client.db.getGlobalUserVar("target", "hours", "custom"), "2");
        assert.match(messages.at(-1).payload.embeds[0].data.description, /now have `2` hours/);
      }
      if (name === "terminal") assert.match(messages.at(-1).payload.content, /visibility-test/);
      if (name === "contributor" || name === "senddm" || name === "denied" || name === "noreply") {
        assert.equal(messages.at(-1).payload.embeds[0].data.title, "Success!");
      }
    });
  }
}

for (const name of ["senddm", "noreply", "addhours"]) {
  test(`/${name} remains public with closed DMs`, async t => {
    const { client, interaction, messages, errors } = fixture(t, name, { closedDMs: true });
    await handleSlash(client, interaction);
    assert.deepEqual(errors, []);
    assert.equal(messages.at(-1).ephemeral, false);
    assert.match(messages.at(-1).payload.embeds[0].data.title, name === "addhours" ? /Volunteer Hours Added/ : /Failed!/);
  });
}

for (const name of ["addhours", "senddm", "noreply", "terminal"]) {
  test(`/${name} rejects unauthorized users privately without side effects`, async t => {
    const { client, interaction, messages, dms, channelMessages } = fixture(t, name);
    interaction.member.permissions.has = () => false;
    interaction.member.roles.cache.clear();
    client.ownerIds = [];
    await handleSlash(client, interaction);
    assert.equal(interaction.deferred, false);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].ephemeral, true);
    assert.match(messages[0].payload.content, /not available/);
    assert.deepEqual(dms, []);
    assert.deepEqual(channelMessages, []);
    assert.equal(Number(client.db.getGlobalUserVar("target", "hours", "custom")), 0);
  });
}

test("visibility audit covers every registered slash command", t => {
  const { client } = fixture(t, "echo");
  assert.deepEqual([...client.registry.slashCommands.keys()].sort(), [...PUBLIC, ...PRIVATE].sort());
});

for (const selected of [false, true]) {
  test(`/hours ${selected ? "user option" : "self lookup"} matches =hours for an ordinary member`, async t => {
    const { client, interaction, messages, errors } = fixture(t, "hours");
    const target = selected ? interaction.options.getUser("user") : interaction.user;
    client.db.setGlobalUserVar(target.id, "hours", "12.5", "custom");
    interaction.options.getUser = () => selected ? target : null;
    interaction.member.permissions.has = () => false;
    interaction.member.roles.cache.clear();
    await handleSlash(client, interaction);
    assert.deepEqual(errors, []);
    assert.equal(messages[0].ephemeral, false);
    const embed = messages[0].payload.embeds[0].toJSON();
    assert.equal(embed.title, `${target.username}'s Volunteer Hours`);
    assert.match(embed.description, /`12\.5`/);
    const { Context } = require("../src/context");
    const prefix = new Context({ client, command: client.registry.resolvePrefix("hours"), message: {
      author: interaction.user, guild: interaction.guild, channel: interaction.channel,
      mentions: { users: { first: () => selected ? target : null } },
      reply: async payload => assert.deepEqual(payload.embeds[0].toJSON(), embed),
    } });
    await prefix.command.execute(prefix);
    assert.equal(client.db.getGlobalUserVar(target.id, "hours", "custom"), "12.5");
  });
}

test("/hours defaults to zero and has a guild-scoped optional user option with no staff restriction", async t => {
  const { client, interaction, messages } = fixture(t, "hours");
  interaction.options.getUser = () => null;
  await handleSlash(client, interaction);
  assert.match(messages[0].payload.embeds[0].data.description, /`0`/);
  const { SLASH_DEFINITIONS, buildDefinition } = require("../src/slash/definitions");
  assert.equal(SLASH_DEFINITIONS.hours.guildId, GUILD_ID);
  const definition = buildDefinition("hours");
  assert.equal(definition.default_member_permissions, undefined);
  assert.equal(definition.integration_types, undefined);
  assert.deepEqual(definition.options.map(({ name, type, required }) => ({ name, type, required })), [
    { name: "user", type: 6, required: false },
  ]);
  assert.equal(require("../src/services/commandAccess").category(client.registry.slashCommands.get("hours")), "volunteer");
});
