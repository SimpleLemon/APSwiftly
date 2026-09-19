"use strict";

const { buildHomeEmbed, buildCommandHomeComponents } = require("../../src/services/levelingMenu");

module.exports = {
  name: "leveling",
  info: {
    description: "Setup and manage Leveling feature.",
    perms: ["`SendMessages`", "`ManageGuild`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (!ctx.hasPerms("ManageGuild")) {
      return ctx.send("You do not have `ManageGuild` permission to use this.");
    }

    await ctx.send({ embeds: [buildHomeEmbed(ctx)], components: buildCommandHomeComponents(ctx) });
  },
};
