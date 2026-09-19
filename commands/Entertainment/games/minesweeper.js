"use strict";

const { Minesweeper } = require("discord-gamecord");

module.exports = {
  name: "minesweeper",
  info: {
    description: "Starts a random minesweeper game.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const game = new Minesweeper({
      message: ctx.message,
      isSlashGame: false,
      embed: {
        title: "Minesweeper",
        color: ctx.getVar("embedcolor"),
        description: "Click on the buttons to reveal the blocks except mines.",
      },
      emojis: { flag: "🚩", mine: "💣" },
      mines: 5,
      timeoutTime: 60000,
      winMessage: "You won the Game! You successfully avoided all the mines.",
      loseMessage: "You lost the Game! Be aware of the mines next time.",
      playerOnlyMessage: "Only {player} can use these buttons.",
    });

    await game.startGame();
  },
};
