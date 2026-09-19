"use strict";

module.exports = {
  slash: { name: "echo" },
  info: {
    description: "Echos message that you send.",
  },
  async execute(ctx) {

    const message = ctx.options.getString("message");
    await ctx.reply({ content: message, allowedMentions: { parse: ["users"] } });
  },
};
