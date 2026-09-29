"use strict";

module.exports = {
  slash: { name: "latex" },
  info: {
    description: "Send LaTeX message through image attachment.",
  },
  async execute(ctx) {
    const expression = ctx.options.getString("latex");
    await ctx.defer();

    await ctx.client.services.renderMath(ctx.channel, { expression, author: ctx.author });
    await ctx.reply("Sent your LaTeX message!");
  },
};
