"use strict";

const { EmbedBuilder } = require("discord.js");
const { eightBallAnswer } = require("../../../src/utils/random");

module.exports = {
  name: "8ball",
  info: {
    description: "Ask a question to 8ball and it will answer it.",
    perms: "`SendMessages`",
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (ctx.rawArgs.length === 0) return ctx.send("Please enter a text.");
    if (ctx.rawArgs.length > 200) return ctx.send("Your question can't be longer than 200 characters.");

    const embed = new EmbedBuilder()
      .setTitle("8ball")
      .addFields({ name: "Answer", value: eightBallAnswer() }, { name: "Question", value: ctx.rawArgs })
      .setThumbnail("https://us-east-1.tixte.net/uploads/dodo-bot.wants.solutions/black8ball.png")
      .setColor(ctx.getVar("embedcolor"))
      .setFooter({ text: "Feel free to ask me more questions!" });

    await ctx.send({ embeds: [embed] });
  },
};
