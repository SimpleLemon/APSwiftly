"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { randomInt } = require("../../../../src/utils/random");

function gameRow(headsStyle, tailsStyle) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("headsbutton")
      .setLabel("Heads")
      .setStyle(headsStyle)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("tailsbutton")
      .setLabel("Tails")
      .setStyle(tailsStyle)
      .setDisabled(true)
  );
}

function originalEmbed(ctx) {
  const embed = ctx.message.embeds[0];
  return new EmbedBuilder()
    .setTitle(embed?.title ?? "")
    .setDescription(embed?.description ?? "")
    .setColor(ctx.getVar("embedcolor"));
}

function didWin() {
  return randomInt(1, 100) >= 38 && randomInt(1, 100) < 89;
}

async function playCoinFlip(ctx, choice) {
  const win = didWin();
  const headsStyle = choice === "heads" ? (win ? ButtonStyle.Success : ButtonStyle.Danger) : ButtonStyle.Secondary;
  const tailsStyle = choice === "tails" ? (win ? ButtonStyle.Success : ButtonStyle.Danger) : ButtonStyle.Secondary;

  await ctx.update({ embeds: [originalEmbed(ctx)], components: [gameRow(headsStyle, tailsStyle)] });

  if (choice === "heads") {
    await ctx.followUp(
      win
        ? `GG, **${ctx.user.username}**! The coin landed on **Heads**!`
        : "You lost! The coin landed on **Tails**!"
    );
    return;
  }

  await ctx.followUp(
    win
      ? `GG, **${ctx.user.username}**! The coin landed on **Tails**!`
      : "You lost! The coin landed on **Hands**!"
  );
}

module.exports = [
  {
    component: "button",
    customId: "headsbutton",
    async execute(ctx) {
      await playCoinFlip(ctx, "heads");
    },
  },
  {
    component: "button",
    customId: "tailsbutton",
    async execute(ctx) {
      await playCoinFlip(ctx, "tails");
    },
  },
];
