"use strict";
const { buildHelpMenu, buildHelpEmbed } = require("../../src/services/helpMenu");
module.exports = { slash: { name: "help" }, info: { description: "Browse commands available to you in this server." }, async execute(ctx) {
  if (!ctx.guild) return ctx.reply("Use /help in a server.",{flags:64});
  return ctx.reply({embeds:[buildHelpEmbed(ctx.client,ctx)],components:[buildHelpMenu(ctx.client,ctx)]},{flags:64});
} };
