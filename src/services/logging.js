"use strict";

const { PermissionFlagsBits, ChannelType } = require("discord.js");

/**
 * Resolves a configured log channel from a guild variable, applying the same
 * guards the legacy code used: not "none", exists, and the bot can send there.
 */
async function resolveLogChannel(client, guild, variableName, table = "main") {
  if (!guild) return null;
  const configured = client.db.getGuildVar(guild.id, variableName, table);
  if (!configured || configured === "none") return null;

  const channel =
    guild.channels.cache.get(configured) ?? (await guild.channels.fetch(configured).catch(() => null));
  if (!channel || !channel.isTextBased()) return null;

  const me = guild.members.me ?? (await guild.members.fetchMe().catch(() => null));
  if (!me) return null;

  const permissions = channel.permissionsFor(me);
  if (!permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) return null;

  return channel;
}

function hasViewAuditLog(guild) {
  const me = guild?.members?.me;
  return Boolean(me?.permissions?.has(PermissionFlagsBits.ViewAuditLog));
}

/**
 * Fetches the most recent audit-log entry of a type, mirroring
 * `$getAuditLogs[guild;;1;type;...]`. Returns null when unavailable.
 */
async function latestAuditEntry(guild, type, options = {}) {
  if (!guild) return null;
  const logs = await guild.fetchAuditLogs({ type, limit: options.limit ?? 1 }).catch(() => null);
  if (!logs) return null;
  const entry = logs.entries.first();
  if (!entry) return null;
  if (options.maxAgeMs && Date.now() - entry.createdTimestamp > options.maxAgeMs) return null;
  return entry;
}

function isBotUser(user) {
  return Boolean(user?.bot);
}

module.exports = { resolveLogChannel, hasViewAuditLog, latestAuditEntry, isBotUser, ChannelType };
