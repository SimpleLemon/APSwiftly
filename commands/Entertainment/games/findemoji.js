"use strict";

const { FindEmoji } = require("discord-gamecord");

module.exports = {
  name: "findemoji",
  aliases: "find-emoji",
  info: {
    description: "Starts a game of Find Emoji.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const game = new FindEmoji({
      message: ctx.message,
      isSlashGame: false,
      embed: {
        title: "Find Emoji",
        color: ctx.getVar("embedcolor"),
        description: "Remember the emojis from the board below.",
        findDescription: "Find the {emoji} emoji before the time runs out.",
      },
      timeoutTime: 60000,
      hideEmojiTime: 5000,
      buttonStyle: "SECONDARY",
      emojis: ["🍉", "🍇", "🍊", "🍋", "🥭", "🍎", "🍏", "🥝"],
      winMessage: "You won! You selected the correct emoji. {emoji}",
      loseMessage: "You lost! You selected the wrong emoji. {emoji}",
      timeoutMessage: "You lost! You ran out of time. The emoji is {emoji}",
      playerOnlyMessage: "Only {player} can use these buttons.",
    });

    await game.startGame();
  },
};
