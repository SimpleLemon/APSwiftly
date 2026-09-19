"use strict";

const { Snake } = require("discord-gamecord");

module.exports = {
  name: "snake",
  aliases: "snek",
  info: {
    description: "Starts a snake game.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const game = new Snake({
      message: ctx.message,
      isSlashGame: false,
      embed: {
        title: "Snake Game",
        overTitle: "Game Over",
        color: ctx.getVar("embedcolor"),
      },
      emojis: {
        board: "⬛",
        food: "🍎",
        up: "⬆️",
        down: "⬇️",
        left: "⬅️",
        right: "➡️",
      },
      snake: { head: "🟢", body: "🟩", tail: "🟢", over: "💀" },
      foods: ["🍎", "🍇", "🍊", "🫐", "🥕", "🥝", "🌽"],
      buttonStyle: "SECONDARY",
      stopButton: "Stop",
      timeoutTime: 60000,
      playerOnlyMessage: "Only {player} can use these buttons.",
    });

    await game.startGame();
  },
};
