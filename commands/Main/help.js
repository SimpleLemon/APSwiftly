"use strict";

const { buildHelpMenu } = require("../../src/services/helpMenu");

module.exports = {
  name: "help",
  info: {
    description: "View every command available to you in the current channel.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (!ctx.guild) {
      return ctx.send("The help menu is available inside a server so it can check your permissions and current channel.");
    }

    const embed = ctx.embed(
      "Select a module below. Modules you cannot use in this server or channel are hidden. Slash commands are shown with a leading `/`.",
      { title: "Help Menu" }
    );

    await ctx.send({ embeds: [embed], components: [buildHelpMenu(ctx.client, ctx)] });
  },
};
