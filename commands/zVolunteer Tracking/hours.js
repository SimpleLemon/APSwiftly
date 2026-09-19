"use strict";

const { getHours } = require("../../src/services/hours");

module.exports = {
  name: "hours",
  aliases: ["me"],
  info: {
    description: "View a user's volunteer hours.",
    perms: ["`SendMessages`"],
  },
  async execute(ctx) {
    const user = ctx.mentioned ?? ctx.author;
    const embed = ctx.embed(`<a:APStudy_gif:1338711325081211004> **Hours:** \`${getHours(ctx.client, user.id)}\``, {
      title: `${user.username}'s Volunteer Hours`,
      color: "#03d7fc",
      footer: "Missing hours? Contact APStudy Representatives.",
    });

    await ctx.reply({ embeds: [embed] });
  },
};
