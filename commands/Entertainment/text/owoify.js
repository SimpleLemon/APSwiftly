"use strict";

const { owoify } = require("../../../src/utils/text");

module.exports = {
  name: "owoify",
  info: {
    description: "Makes text OWOifed.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (ctx.rawArgs.length === 0) return ctx.send("Please enter a text.");
    await ctx.send({ content: owoify(ctx.rawArgs), allowedMentions: { parse: [] } });
  },
};
