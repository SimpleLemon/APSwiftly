"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const TIMEOUT_MS = 30_000;

function gameRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ftf1").setEmoji("1️⃣").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId("ftf2").setEmoji("2️⃣").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId("ftf3").setEmoji("3️⃣").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
  );
}

function scheduleTimeout(ctx, message) {
  setTimeout(async () => {
    try {
      const channel = await ctx.client.channels.fetch(message.channelId).catch(() => null);
      if (!channel?.messages) return;
      if (channel.guild) {
        const perms = channel.permissionsFor(ctx.client.user);
        if (perms && !perms.has(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages)) return;
      }

      const fetched = await channel.messages.fetch(message.id).catch(() => null);
      if (!fetched) return;

      const row = fetched.components?.[0];
      if (row?.components?.every((component) => component.disabled)) return;

      const embed = fetched.embeds[0];
      await fetched.edit({
        content: "Game has been ended due to inactivity.",
        embeds: [
          new EmbedBuilder()
            .setTitle(embed?.title ?? "")
            .setDescription(embed?.description ?? "")
            .setColor(ctx.getVar("embedcolor")),
        ],
        components: [gameRow(true)],
      });
    } catch {
      /* message may have been deleted or is no longer editable */
    }
  }, TIMEOUT_MS);
}

module.exports = {
  name: "findtheflag",
  aliases: "ftf",
  info: {
    description: "Starts a game of Find the flag.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const embed = new EmbedBuilder()
      .setTitle("🚩 | Find the flag!")
      .setDescription("There is a hidden flag somewhere around 1-3, where you think the flag is on?")
      .setColor(ctx.getVar("embedcolor"));

    const message = await ctx.send({ embeds: [embed], components: [gameRow(false)] });
    scheduleTimeout(ctx, message);
  },
};
