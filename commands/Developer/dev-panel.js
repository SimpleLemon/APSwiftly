"use strict";

const { mainPanelEmbed, mainPanelComponents } = require("../../src/services/devPanel");

module.exports = {
  name: "dev-panel",
  aliases: ["developer-panel", "dev-settings", "devpanel"],
  info: {
    description: "Special settings dedicated to devs. Allows the user to change stuff!",
    perms: ["`SendMessages`"],
    dev: "true",
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (!ctx.client.ownerIds.includes(ctx.authorId)) return;

    await ctx.send({
      embeds: [mainPanelEmbed("Developer panel")],
      components: mainPanelComponents(ctx.authorId),
    });
  },
};
