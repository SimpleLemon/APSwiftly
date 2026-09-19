"use strict";

const { EmbedBuilder } = require("discord.js");
const { resolveLogChannel, latestAuditEntry } = require("../../../src/services/logging");

const BAN_TYPES = { banAdd: 22, banRemove: 23 };

module.exports = [
  {
    event: "banAdd",
    async execute(ctx) {
      const { client, guild, ban } = ctx;
      if (!guild || !ban?.user) return;
      if (client.db.getGuildVar(guild.id, "banneduserslog") !== "on") return;

      const channel = await resolveLogChannel(client, guild, "membereventschannel");
      if (!channel) return;
      if (!guild.members.me?.permissions.has("ViewAuditLog")) return;

      const entry = await latestAuditEntry(guild, BAN_TYPES.banAdd, { maxAgeMs: 15000 });
      const staff = entry?.executor?.id;
      const anonymous = client.db.getGuildVar(guild.id, "anonymous") === "on";
      const moderator = staff ? (anonymous ? "Unknown" : `${entry.executor.username} <@${staff}>`) : "Unknown";
      const reason = entry?.reason ?? "none";
      const accountType = ban.user.bot ? "Bot" : "User";

      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Member banned!",
          iconURL: ban.user.displayAvatarURL({ extension: "png", size: 128 }),
        })
        .setDescription(
          [`**${accountType}:** ${ban.user.username} <@${ban.user.id}>`, `**Moderator:** ${moderator}`, `**Reason:** ${reason}`].join("\n")
        )
        .setFooter({ text: `ID: ${ban.user.id}` })
        .setTimestamp()
        .setColor("Red");

      await channel.send({ embeds: [embed] });
    },
  },
  {
    event: "banRemove",
    async execute(ctx) {
      const { client, guild, ban } = ctx;
      if (!guild || !ban?.user) return;
      if (client.db.getGuildVar(guild.id, "unbanneduserslog") !== "on") return;

      const channel = await resolveLogChannel(client, guild, "membereventschannel");
      if (!channel) return;
      if (!guild.members.me?.permissions.has("ViewAuditLog")) return;

      const entry = await latestAuditEntry(guild, BAN_TYPES.banRemove, { maxAgeMs: 15000 });
      const staff = entry?.executor?.id;
      const moderator = staff ? `${entry.executor.username} <@${staff}>` : "Unknown";
      const reason = entry?.reason ?? null;
      const accountType = ban.user.bot ? "Bot" : "User";

      const lines = [`**${accountType}:** ${ban.user.username} <@${ban.user.id}>`, `**Moderator:** ${moderator}`];
      if (reason !== null) lines.push(`**Reason:** ${reason}`);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Member unbanned!",
          iconURL: ban.user.displayAvatarURL({ extension: "png", size: 128 }),
        })
        .setDescription(lines.join("\n"))
        .setFooter({ text: `ID: ${ban.user.id}` })
        .setTimestamp()
        .setColor("DarkGreen");

      await channel.send({ embeds: [embed] });
    },
  },
];
