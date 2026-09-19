"use strict";

const { buildLoggingEmbed, buildLoggingComponents } = require("../../src/services/logsMenu");

module.exports = {
  name: "logs",
  aliases: ["logging", "logs-setup", "setup-logs", "logging-setup"],
  info: {
    description: "Setup Logs available of the bot.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (!ctx.hasPerms("ManageChannels")) {
      return ctx.send("You do not have `ManageChannels` permission to use this.");
    }

    await ctx.send({ embeds: [buildLoggingEmbed(ctx, "Logging")], components: buildLoggingComponents(ctx) });
  },
};
