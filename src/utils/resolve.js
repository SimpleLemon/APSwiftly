"use strict";

const MENTION_RE = /^<@!?(\d{15,25})>$/;
const ID_RE = /^\d{15,25}$/;
const ROLE_MENTION_RE = /^<@&(\d{15,25})>$/;
const CHANNEL_MENTION_RE = /^<#(\d{15,25})>$/;

function extractId(input, pattern) {
  if (!input) return null;
  const mention = pattern.exec(String(input));
  if (mention) return mention[1];
  if (ID_RE.test(String(input))) return String(input);
  return null;
}

/** Mirrors `$findUser[id;true]` - falls back to the fallback user. */
async function resolveUser(client, input, fallback = null) {
  const id = extractId(input, MENTION_RE);
  if (!id) return fallback;
  return client.users.fetch(id).catch(() => fallback);
}

/** Resolves a guild member from a mention/ID, falling back to the provided member. */
async function resolveMember(guild, input, fallback = null) {
  const id = extractId(input, MENTION_RE);
  if (!id || !guild) return fallback;
  return guild.members.fetch(id).catch(() => fallback);
}

function resolveRole(guild, input) {
  const id = extractId(input, ROLE_MENTION_RE);
  if (!id || !guild) return null;
  return guild.roles.cache.get(id) ?? null;
}

function resolveChannel(guild, input) {
  const id = extractId(input, CHANNEL_MENTION_RE);
  if (!id || !guild) return null;
  return guild.channels.cache.get(id) ?? null;
}

module.exports = { resolveUser, resolveMember, resolveRole, resolveChannel, extractId };
