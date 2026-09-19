"use strict";

module.exports = {
  slash: { name: "reverse" },
  info: {
    description: "Let's you reverse text.",
  },
  async execute(ctx) {

    const text = ctx.options.getString("text");
    await ctx.reply(
      { content: text.split("").reverse().join(""), allowedMentions: { parse: ["users"] } },
      { flags: 64 }
    );
  },
};
