"use strict";

const { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const { Flood } = require("discord-gamecord");

function toUpper(value) {
  return String(value ?? "").toLocaleUpperCase();
}

function floodMode(difficulty) {
  const value = Number(difficulty);
  if (value === 18) return "Hard";
  if (value === 13) return "Normal";
  if (value === 8) return "Easy";
  return String(difficulty ?? "");
}

function settingsRow(authorId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`floodsettings_${authorId}`)
      .setPlaceholder("Select a option")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: "Difficulty",
          description: "How hard the game will be?",
          value: "flooddifficulty",
        },
      ])
  );
}

async function startFlood(ctx) {
  const game = new Flood({
    message: ctx.message,
    isSlashGame: false,
    embed: {
      title: "Flood",
      color: ctx.getVar("embedcolor"),
    },
    difficulty: Number(ctx.getGlobalUserVar(ctx.authorId, "flood_difficulty", "main")),
    timeoutTime: 60000,
    buttonStyle: "SECONDARY",
    emojis: ["🟥", "🟦", "🟧", "🟪", "🟩"],
    winMessage: "You won! You took **{turns}** turns.",
    loseMessage: "You lost! You took **{turns}** turns.",
    playerOnlyMessage: "Only {player} can use these buttons.",
  });

  await game.startGame();
}

async function showFloodSettings(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Flood Settings")
    .setDescription("Welcome to Flood settings! To select a option to change, use the dropdown menu below!")
    .addFields({
      name: "**Current Setup**",
      value: `**Difficulty:** \`${floodMode(ctx.getGlobalUserVar(ctx.authorId, "flood_difficulty", "main"))}\``,
    })
    .setColor(ctx.getVar("embedcolor"));

  await ctx.send({ embeds: [embed], components: [settingsRow(ctx.authorId)] });
}

module.exports = {
  name: "flood",
  info: {
    description: "Starts a game of Flood (pass the flag `--settings` to open up the settings).",
    perms: ["`SendMessages`"],
    flags: ["`--settings`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const settings = ctx.args.some((arg) => arg === "--settings" || arg === "—settings");
    return settings ? showFloodSettings(ctx) : startFlood(ctx);
  },
};
