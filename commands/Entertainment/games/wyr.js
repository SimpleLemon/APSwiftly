"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { httpJson } = require("../../../src/utils/http");

const API_URL = "https://api.gamecord.xyz/wyr";

function voteRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("0")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("wyr1-votebutton")
      .setEmoji("1️⃣"),
    new ButtonBuilder()
      .setLabel("0")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("wyr2-votebutton")
      .setEmoji("2️⃣")
  );
}

module.exports = {
  name: "would-you-rather",
  aliases: "wyr",
  info: {
    description: "Starts a wyr game of two options to choose from.",
    perms: ["`SendMessages`", "`AddReactions` (if using `--usereactions` flag)"],
    flags: ["`--usereactions`"],
  },
  cooldown: {
    time: 4000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const response = await httpJson(API_URL);
    const data = response?.data;
    if (!data || typeof data !== "object") {
      return ctx.send("Unable to fetch data for wyr. Please try again later.");
    }

    const embed = new EmbedBuilder()
      .setTitle("Would you rather...")
      .addFields(
        { name: "**Option 1**", value: String(data.option1 ?? "") },
        { name: "**Option 2**", value: String(data.option2 ?? "") }
      )
      .setColor(ctx.getVar("embedcolor"));

    const useReactions = ctx.args.some(
      (arg) => arg === "--usereactions" || arg === "—usereactions"
    );

    if (useReactions) {
      const canReact =
        !ctx.guild || ctx.channel.permissionsFor(ctx.client.user)?.has(PermissionFlagsBits.AddReactions);
      if (!canReact) {
        return ctx.send(
          "I do not have permissions to add reactions to my message in this channel. Please either grant me `AddReactions` permission or use buttons instead."
        );
      }

      const message = await ctx.send({ embeds: [embed] });
      await message.react("1️⃣");
      await message.react("2️⃣");
      return;
    }

    await ctx.send({ embeds: [embed], components: [voteRow()] });
  },
};
