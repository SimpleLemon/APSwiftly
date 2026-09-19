"use strict";

const { Connect4 } = require("discord-gamecord");

module.exports = {
  name: "connect4",
  aliases: ["c4", "connectfour"],
  info: {
    description: "Start a connect4 match with your opponent.",
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

    const game = new Connect4({
      message: ctx.message,
      isSlashGame: false,
      opponent,
      embed: {
        title: "Connect4 Game",
        statusTitle: "Status",
        color: ctx.getVar("embedcolor"),
      },
      emojis: {
        board: "⚪",
        player1: "🔴",
        player2: "🟡",
      },
      mentionUser: true,
      timeoutTime: 60000,
      buttonStyle: "SECONDARY",
      turnMessage: "{emoji} | Its turn of player **{player}**.",
      winMessage: "{emoji} | **{player}** won the Connect4 Game.",
      tieMessage: "The Game tied! No one won the Game!",
      timeoutMessage: "The Game went unfinished! No one won the Game!",
      playerOnlyMessage: "Only {player} and {opponent} can use these buttons.",
    });

    await game.startGame();
  },
};
