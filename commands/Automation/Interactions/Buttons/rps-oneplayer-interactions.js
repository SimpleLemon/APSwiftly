"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { pick } = require("../../../../src/utils/random");

const CHOICES = {
  rpsrockbutton: { text: "Rock 🌑" },
  rpspaperbutton: { text: "Paper 📰" },
  rpsscissorsbutton: { text: "Scissors ✂️" },
};

function gameRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("rpsrockbutton")
      .setLabel("Rock")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🌑")
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("rpspaperbutton")
      .setLabel("Paper")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📰")
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("rpsscissorsbutton")
      .setLabel("Scissors")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("✂️")
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

async function playOnePlayer(ctx, choice) {
  const botSelection = pick(["Rock 🌑", "Paper 📰", "Scissors ✂️"]);

  await ctx.update({ embeds: [originalEmbed(ctx)], components: [gameRow()] });

  const embed = new EmbedBuilder()
    .setTitle("Results!")
    .setDescription(`You choose ${CHOICES[choice].text}! I choose ${botSelection}!`)
    .setColor("Yellow");

  await ctx.followUp({ embeds: [embed] });
}

module.exports = [
  {
    component: "button",
    customId: "rpsrockbutton",
    async execute(ctx) {
      await playOnePlayer(ctx, "rpsrockbutton");
    },
  },
  {
    component: "button",
    customId: "rpspaperbutton",
    async execute(ctx) {
      await playOnePlayer(ctx, "rpspaperbutton");
    },
  },
  {
    component: "button",
    customId: "rpsscissorsbutton",
    async execute(ctx) {
      await playOnePlayer(ctx, "rpsscissorsbutton");
    },
  },
];
