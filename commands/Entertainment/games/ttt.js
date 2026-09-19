"use strict";

const { TicTacToe } = require("discord-gamecord");

module.exports = {
  name: "tictactoe",
  aliases: "ttt",
  info: {
    description: "Start a tictactoe match with your opponent.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const opponent = ctx.mentioned;

    if (!opponent || opponent.id === ctx.authorId) {
      return ctx.send("Please mention a opponent to play with!");
    }
    if (opponent.bot) {
      return ctx.send("You cannot play with bots!");
    }

    const game = new TicTacToe({
      message: ctx.message,
      isSlashGame: false,
      opponent,
      embed: {
        title: "Tic Tac Toe",
        color: ctx.getVar("embedcolor"),
        statusTitle: "Status",
        overTitle: "Game Over",
      },
      emojis: {
        xButton: "❌",
        oButton: "🔵",
        blankButton: "➖",
      },
      mentionUser: true,
      timeoutTime: 60000,
      xButtonStyle: "SECONDARY",
      oButtonStyle: "SECONDARY",
      turnMessage: "{emoji} | Its turn of player **{player}**.",
      winMessage: "{emoji} | **{player}** won the TicTacToe Game.",
      tieMessage: "The Game tied! No one won the Game!",
      timeoutMessage: "The Game went unfinished! No one won the Game!",
      playerOnlyMessage: "Only {player} and {opponent} can use these buttons.",
    });

    await game.startGame();
  },
};
