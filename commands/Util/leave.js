"use strict";

const { PermissionFlagsBits } = require("discord.js");
const { buildHomeEmbed, buildHomeComponents } = require("../../src/services/welcomeMenu");

module.exports = {
  name: "leave",
  info: {
    description: "Setup and manage Leave feature.",
    perms: ["`SendMessages`", "`ManageChannels`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (!ctx.hasPerms(PermissionFlagsBits.ManageChannels)) {
      return ctx.send("You do not have `ManageChannels` permission to use this.");
    }

    await ctx.send({
      embeds: [buildHomeEmbed(ctx, "leave")],
      components: buildHomeComponents(ctx, "leave"),
    });
  },
};
