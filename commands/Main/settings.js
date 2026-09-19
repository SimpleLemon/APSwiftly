"use strict";

const { buildSettingsMenu } = require("../../src/services/settingsMenu");

module.exports = {
  name: "settings",
  aliases: ["panel", "guildsettings", "serversettings"],
  info: {
    description: "Let's you manage some options of APSwiftly.",
    perms: ["`SendMessages`", "`ManageGuild`"],
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (!ctx.hasPerms("ManageGuild")) {
      return ctx.send("You do not have `ManageGuild` permission to use this.");
    }

    const embed = ctx.embed(
      [
        "Welcome to settings! Here, you can change things the bot usually operates.",
        "",
        "To change any option, use the dropdown menu below to manage each one accordingly.",
      ].join("\n"),
      { title: "Settings" }
    );
    embed.setThumbnail("https://us-east-1.tixte.net/uploads/dodogames.wants.solutions/yellowgear.png");

    await ctx.send({ embeds: [embed], components: [buildSettingsMenu(ctx)] });
  },
};
