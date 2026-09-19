"use strict";

const { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const { Hangman } = require("discord-gamecord");

const HANGMAN_THEMES = [
  { label: "Nature", description: "Sets the theme to Nature-related", value: "nature" },
  { label: "Sport", description: "Sets the theme to Sport-related", value: "sport" },
  { label: "Color", description: "Sets the theme to Color-related", value: "color" },
  { label: "Camp", description: "Sets the theme to Camp-related", value: "camp" },
  { label: "Fruit", description: "Sets the theme to Fruit-related", value: "fruit" },
  { label: "Discord", description: "Sets the theme to Discord-related", value: "discord" },
  { label: "Winter", description: "Sets the theme to Winter-related", value: "winter" },
  { label: "Pokemon", description: "Sets the theme to Pokemon-related", value: "pokemon" },
];

function toUpper(value) {
  return String(value ?? "").toLocaleUpperCase();
}

function settingsRow(authorId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`hangmansettings_${authorId}`)
      .setPlaceholder("Select a theme")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(HANGMAN_THEMES)
  );
}

async function startHangman(ctx) {
  const game = new Hangman({
    message: ctx.message,
    isSlashGame: false,
    embed: {
      title: "Hangman",
      color: ctx.getVar("embedcolor"),
    },
    hangman: { hat: "🎩", head: "😟", shirt: "👕", pants: "🩳", boots: "👞👞" },
    customWord: null,
    timeoutTime: 60000,
    theme: ctx.getGlobalUserVar(ctx.authorId, "hangman_theme", "main"),
    winMessage: "You won! The word was {word}.",
    loseMessage: "You lost! The word was {word}.",
    playerOnlyMessage: "Only {player} can use these buttons.",
  });

  await game.startGame();
}

async function showHangmanSettings(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Hangman Themes")
    .setDescription("Welcome to Hangman Themes! To select a theme to use, use the dropdown menu below!")
    .addFields({
      name: "**Current theme**",
      value: `* \`${toUpper(ctx.getGlobalUserVar(ctx.authorId, "hangman_theme", "main"))}\``,
    })
    .setColor(ctx.getVar("embedcolor"));

  await ctx.send({ embeds: [embed], components: [settingsRow(ctx.authorId)] });
}

module.exports = {
  name: "hangman",
  aliases: "hm",
  info: {
    description: "Starts a hangman game (pass the flag `--themes` to change the current theme).",
    perms: ["`SendMessages`"],
    flags: ["`--themes`", "`--settings` (alias)"],
  },
  cooldown: {
    time: 4000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const settings = ctx.args.some(
      (arg) =>
        arg === "--themes" ||
        arg === "—themes" ||
        arg === "--settings" ||
        arg === "—settings"
    );
    return settings ? showHangmanSettings(ctx) : startHangman(ctx);
  },
};
