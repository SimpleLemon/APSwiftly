"use strict";

const { EmbedBuilder } = require("discord.js");
const { applyTemplate } = require("../utils/templates");

function ordinal(number) {
  const value = Number(number);
  if (!Number.isFinite(value)) return "?";
  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = value % 100;
  return `${value}${suffixes[(mod100 - 20) % 10] ?? suffixes[mod100] ?? suffixes[0]}`;
}

function formatDate(ms) {
  return new Date(ms).toDateString();
}

function buildValues({ guild, user, member, extra = {} }) {
  const now = Date.now();
  return {
    "<server.totalMembers>": String(guild?.memberCount ?? ""),
    "<username>": user?.username ?? "",
    "<mention>": user ? `<@${user.id}>` : "",
    "<id>": user?.id ?? "",
    "<owner.username>": guild?.ownerId ? `<@${guild.ownerId}>` : "",
    "<owner.id>": guild?.ownerId ?? "",
    "<server.name>": guild?.name ?? "",
    "<server.id>": guild?.id ?? "",
    "<creationdate>": formatDate(user?.createdTimestamp ?? now),
    "<position>": member?.joinedTimestamp ? ordinal(guild?.memberCount ?? 0) : "?",
    "<Displayname>": member?.displayName ?? user?.username ?? "",
    "<leave.time>": `<t:${Math.trunc(now / 1000)}:f>`,
    ...extra,
  };
}

function buildWelcomePayload(client, { guild, user, member, test = false }) {
  const content = applyTemplate(client.db.getGuildVar(guild.id, "welcomemessage"), buildValues({ guild, user, member }));
  const type = client.db.getGuildVar(guild.id, "welcometype");
  const useEmbed = type === "embed" || content.length >= 2000;

  if (!useEmbed) {
    const text = test ? `**This is a test welcome message! Please, ignore this.**\n${content}` : content;
    return { content: text, allowedMentions: { parse: [] } };
  }

  const serverIcon = guild.iconURL({ extension: "png", size: 256 });
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Member joined", iconURL: serverIcon ?? client.user.displayAvatarURL() })
    .setDescription(content)
    .setThumbnail(user.displayAvatarURL({ extension: "png", size: 256 }))
    .setColor(client.db.getGuildVar(guild.id, "welcomemessageembedcolor") || "#1F8B4C");

  if (test) {
    return { content: "**This is a test welcome message! Please, ignore this.**", embeds: [embed], allowedMentions: { parse: [] } };
  }
  return { embeds: [embed], allowedMentions: { parse: [] } };
}

function buildLeavePayload(client, { guild, user, member, test = false }) {
  const content = applyTemplate(client.db.getGuildVar(guild.id, "leavemessage"), buildValues({ guild, user, member }));
  const type = client.db.getGuildVar(guild.id, "leavetype");
  const useEmbed = type === "embed" || content.length >= 2000;

  if (!useEmbed) {
    const text = test ? `**This is a test Leave message! Please, ignore this.**\n${content}` : content;
    return { content: text, allowedMentions: { parse: [] } };
  }

  const serverIcon = guild.iconURL({ extension: "png", size: 256 });
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Member left", iconURL: serverIcon ?? client.user.displayAvatarURL() })
    .setDescription(content)
    .setThumbnail(user.displayAvatarURL({ extension: "png", size: 256 }))
    .setColor(client.db.getGuildVar(guild.id, "leavemessageembedcolor") || "#ED4245");

  if (test) {
    return { content: "**This is a test Leave message! Please, ignore this.**", embeds: [embed], allowedMentions: { parse: [] } };
  }
  return { embeds: [embed], allowedMentions: { parse: [] } };
}

async function sendWelcome(client, { guild, user, member }) {
  if (client.db.getGuildVar(guild.id, "welcomesystem") !== "on") return false;
  const channel = await client.services.logging.resolveLogChannel(client, guild, "welcomechannel");
  if (!channel) return false;
  await channel.send(buildWelcomePayload(client, { guild, user, member }));
  return true;
}

async function sendLeave(client, { guild, user, member }) {
  if (client.db.getGuildVar(guild.id, "leavesystem") !== "on") return false;
  const channel = await client.services.logging.resolveLogChannel(client, guild, "leavechannel");
  if (!channel) return false;
  await channel.send(buildLeavePayload(client, { guild, user, member }));
  return true;
}

module.exports = { sendWelcome, sendLeave, buildWelcomePayload, buildLeavePayload, ordinal };
