"use strict";

const { EmbedBuilder } = require("discord.js");
const { eightBallAnswer } = require("../../src/utils/random");

module.exports = {
  slash: { name: "8ball" },
  info: {
    description: "Ask a question to 8ball and it will answer it.",
  },
  async execute(ctx) {

    const question = ctx.options.getString("question");
    if (question.length > 200) {
      return ctx.reply("Your question can't be longer than 200 characters.", { flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setTitle("8ball")
      .addFields({ name: "Question", value: question }, { name: "Answer", value: eightBallAnswer() })
      .setThumbnail("https://us-east-1.tixte.net/uploads/dodo-bot.wants.solutions/black8ball.png")
      .setColor(ctx.getVar("embedcolor"));

    await ctx.reply(
      { embeds: [embed], allowedMentions: { parse: ["everyone", "users", "roles"] } },
      { flags: 64 }
    );
  },
};
