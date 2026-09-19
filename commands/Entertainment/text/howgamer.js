"use strict";

const { EmbedBuilder } = require("discord.js");
const { randomInt } = require("../../../src/utils/random");
const { randomColor } = require("../../../src/utils/text");

module.exports = {
  name: "howgamer",
  info: {
    description: "Check on how much gamer you're or the user mentioned.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const user = ctx.mentioned ?? ctx.author;
    const target = user.id === ctx.author.id ? "You're" : `${user.username} is`;

    const embed = new EmbedBuilder()
      .setTitle("HowGamer machine")
      .setDescription(`${target} ${randomInt(0, 100)}% Gamer`)
      .setColor(`#${randomColor()}`);

    await ctx.send({ embeds: [embed] });
  },
};
