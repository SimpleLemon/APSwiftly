"use strict";

const { EmbedBuilder } = require("discord.js");

const PART1 = "https://us-east-1.tixte.net/uploads/dodogames.wants.solutions/whereiseveryone-part1.png";
const PART2 = "https://us-east-1.tixte.net/uploads/dodogames.wants.solutions/whereiseveryone-part2.jpg";
const PART3 = "https://us-east-1.tixte.net/uploads/dodogames.wants.solutions/whereiseveryone-part3.jpg";

module.exports = {
  name: "whereiseveryone",
  info: {
    description: "Starts a short recreation of cut-scene from Shrek movie.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const sent = await ctx.send({
      embeds: [new EmbedBuilder().setTitle('"It\'s quiet..."').setImage(PART1)],
    });

    setTimeout(() => {
      sent
        .edit({ embeds: [new EmbedBuilder().setTitle('"Too quiet..."').setImage(PART2)] })
        .catch(() => {});
    }, 5000);
    setTimeout(() => {
      sent
        .edit({ embeds: [new EmbedBuilder().setTitle('"Where is Everyone?"').setImage(PART3)] })
        .catch(() => {});
    }, 10000);
  },
};
