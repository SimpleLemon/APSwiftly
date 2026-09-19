"use strict";

module.exports = {
  slash: { name: "owoify" },
  info: {
    description: "Makes text OWOifed.",
  },
  async execute(ctx) {

    const text = ctx.options.getString("text");
    await ctx.reply(
      { content: ctx.helpers.owoify(text), allowedMentions: { parse: ["users"] } },
      { flags: 64 }
    );
  },
};
