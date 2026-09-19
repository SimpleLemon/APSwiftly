"use strict";

const { EmbedBuilder } = require("discord.js");
const { randomTopic } = require("../../../src/utils/random");

module.exports = {
  name: "randomtopic",
  aliases: ["newtopic", "topic"],
  info: {
    description: "Start a random topic in this server.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const embed = new EmbedBuilder()
      .setTitle("Random topic")
      .setDescription(randomTopic())
      .setFooter({
        text: `Started by ${ctx.author.username}`,
        iconURL: ctx.author.displayAvatarURL({ extension: "png", size: 128 }),
      })
      .setColor(ctx.getVar("embedcolor"))
      .setTimestamp();

    await ctx.send({ embeds: [embed] });
  },
};
