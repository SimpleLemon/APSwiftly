"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { resolveLogChannel, latestAuditEntry } = require("../../../src/services/logging");

const BOT_ADD_TYPE = 80;

module.exports = {
  event: "join",
  async execute(ctx) {
    const { client, guild, user, member } = ctx;
    if (!guild || !user?.bot) return;
    if (client.db.getGuildVar(guild.id, "Integrationlog") !== "on") return;

    const channel = await resolveLogChannel(client, guild, "servereventschannel");
    if (!channel) return;
    if (!guild.members.me?.permissions.has("ViewAuditLog")) return;

    const entry = await latestAuditEntry(guild, BOT_ADD_TYPE, { maxAgeMs: 30000 });
    const staffId = entry?.executor?.id;
    const verified = user.flags?.has("VerifiedBot") ? "Yes" : "No";
    const addedBy = staffId ? `<@${staffId}>` : "Unknown";

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "A new bot has been added!",
        iconURL: user.displayAvatarURL({ extension: "png", size: 128 }),
      })
      .setDescription(
        [
          `* **Name:** ${user.username} <@${user.id}>`,
          `* **Tag:** ${user.tag}`,
          `* **Added by:** ${addedBy}`,
          `* **Added on:** <t:${Math.trunc(Date.now() / 1000)}:f>`,
          `* **Verified:** ${verified}`,
          `* **Created on:** <t:${Math.trunc(user.createdTimestamp / 1000)}:f>`,
        ].join("\n")
      )
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("View Permissions").setStyle(ButtonStyle.Secondary).setCustomId(`viewbotpermsbutton_${user.id}`)
    );

    await channel.send({ embeds: [embed], components: [row] });
    void member;
  },
};
