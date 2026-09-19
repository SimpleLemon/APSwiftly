"use strict";

const { TwoZeroFourEight } = require("discord-gamecord");

module.exports = {
  name: "2048",
  info: {
    description: "Starts a random game of 2048.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const game = new TwoZeroFourEight({
      message: ctx.message,
      isSlashGame: false,
      embed: {
        title: "2048",
        color: ctx.getVar("embedcolor"),
      },
      emojis: {
        up: "⬆️",
        down: "⬇️",
        left: "⬅️",
        right: "➡️",
      },
      timeoutTime: 60000,
      buttonStyle: "SECONDARY",
      playerOnlyMessage: "Only {player} can use these buttons.",
    });

    await game.startGame();
  },
};
