"use strict";

const { Wordle } = require("discord-gamecord");

module.exports = {
  name: "wordle",
  info: {
    description: "Starts a game of wordle.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const game = new Wordle({
      message: ctx.message,
      isSlashGame: false,
      embed: {
        title: "Wordle",
        color: ctx.getVar("embedcolor"),
      },
      customWord: null,
      timeoutTime: 60000,
      winMessage: "You won! The word was {word}.",
      loseMessage: "You lost! The word was {word}.",
      playerOnlyMessage: "Only {player} can use these buttons.",
    });

    await game.startGame();
  },
};
