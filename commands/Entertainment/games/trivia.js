"use strict";

const { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const { Trivia } = require("discord-gamecord");

function toUpper(value) {
  return String(value ?? "").toLocaleUpperCase();
}

function settingsRow(authorId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`triviasettings_${authorId}`)
      .setPlaceholder("Select a option")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: "Type",
          description: "How the game should start?",
          value: "triviatype",
        },
        {
          label: "Difficulty",
          description: "How hard the game will be?",
          value: "triviadifficulty",
        },
      ])
  );
}

async function startTrivia(ctx) {
  const game = new Trivia({
    message: ctx.message,
    isSlashGame: false,
    embed: {
      title: "Trivia",
      color: ctx.getVar("embedcolor"),
      description: "You have 60 seconds to guess the answer.",
    },
    timeoutTime: 60000,
    buttonStyle: "SECONDARY",
    trueButtonStyle: "SUCCESS",
    falseButtonStyle: "DANGER",
    mode: ctx.getGlobalUserVar(ctx.authorId, "trivia_type", "main"),
    difficulty: ctx.getGlobalUserVar(ctx.authorId, "trivia_difficulty", "main"),
    winMessage: "You won! The correct answer is {answer}.",
    loseMessage: "You lost! The correct answer is {answer}.",
    errMessage: "Unable to fetch question data! Please try again.",
    playerOnlyMessage: "Only {player} can use these buttons.",
  });

  await game.startGame();
}

async function showTriviaSettings(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Trivia Settings")
    .setDescription("Welcome to Trivia settings! To select a option to change, use the dropdown menu below!")
    .addFields({
      name: "**Current Setup**",
      value: [
        `**Type:** \`${toUpper(ctx.getGlobalUserVar(ctx.authorId, "trivia_type", "main"))}\``,
        `**Difficulty:** \`${toUpper(ctx.getGlobalUserVar(ctx.authorId, "trivia_difficulty", "main"))}\``,
      ].join("\n"),
    })
    .setColor(ctx.getVar("embedcolor"));

  await ctx.send({ embeds: [embed], components: [settingsRow(ctx.authorId)] });
}

module.exports = {
  name: "trivia",
  aliases: "triv",
  info: {
    description: "Starts a random Trivia game (pass the flag `--settings` to open up the settings).",
    perms: ["`SendMessages`"],
    flags: ["`--settings`"],
  },
  cooldown: {
    time: 4000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const settings = ctx.args.some((arg) => arg === "--settings" || arg === "—settings");
    return settings ? showTriviaSettings(ctx) : startTrivia(ctx);
  },
};
