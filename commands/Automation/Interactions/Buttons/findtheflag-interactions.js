"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { pick, randomInt } = require("../../../../src/utils/random");

function gameRow(styles, emojis) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ftf1").setEmoji(emojis[0]).setStyle(styles[0]).setDisabled(true),
    new ButtonBuilder().setCustomId("ftf2").setEmoji(emojis[1]).setStyle(styles[1]).setDisabled(true),
    new ButtonBuilder().setCustomId("ftf3").setEmoji(emojis[2]).setStyle(styles[2]).setDisabled(true)
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

async function pickZone(ctx, zone) {
  const win = didWin();
  const styles = [ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Secondary];
  const emojis = ["1️⃣", "2️⃣", "3️⃣"];
  let followUp;

  if (win) {
    styles[zone - 1] = ButtonStyle.Success;
    emojis[zone - 1] = "🏳️";
    followUp = new EmbedBuilder()
      .setTitle("You found the flag!")
      .setDescription(`Nice guess, the flag was on zone ${zone}! 🏳️`)
      .setColor("DarkGreen");
  } else {
    styles[zone - 1] = ButtonStyle.Danger;
    const zones = { 1: ["2", "3"], 2: ["1", "3"], 3: ["1", "2"] };
    const actual = pick(zones[zone]);
    followUp = new EmbedBuilder()
      .setTitle("Aww.. miss!")
      .setDescription(`Wrong guess... the flag was on zone ${actual}. 🏴`)
      .setColor("Red");
  }

  await ctx.update({ embeds: [originalEmbed(ctx)], components: [gameRow(styles, emojis)] });
  await ctx.followUp({ embeds: [followUp] });
}

module.exports = [
  {
    component: "button",
    customId: "ftf1",
    async execute(ctx) {
      await pickZone(ctx, 1);
    },
  },
  {
    component: "button",
    customId: "ftf2",
    async execute(ctx) {
      await pickZone(ctx, 2);
    },
  },
  {
    component: "button",
    customId: "ftf3",
    async execute(ctx) {
      await pickZone(ctx, 3);
    },
  },
];
