"use strict";

const { MatchPairs } = require("discord-gamecord");

module.exports = {
  name: "match-pairs",
  aliases: "matchpairs",
  info: {
    description: "Starts a random matchpairs game.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const game = new MatchPairs({
      message: ctx.message,
      isSlashGame: false,
      embed: {
        title: "Match Pairs",
        color: ctx.getVar("embedcolor"),
        description: "**Click on the buttons to match emojis with their pairs.**",
      },
      timeoutTime: 60000,
      emojis: ["🍉", "🍇", "🍊", "🥭", "🍎", "🍏", "🥝", "🥥", "🍓", "🫐", "🍍", "🥕", "🥔"],
      winMessage: "**You won the Game! You turned a total of `{tilesTurned}` tiles.**",
      loseMessage: "**You lost the Game! You turned a total of `{tilesTurned}` tiles.**",
      playerOnlyMessage: "Only {player} can use these buttons.",
    });

    await game.startGame();
  },
};
