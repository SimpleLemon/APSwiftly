"use strict";

const { LatexInputError } = require("../../src/services/renderMath");

module.exports = {
  slash: { name: "latex" },
  info: {
    description: "Send LaTeX message through image attachment.",
  },
  async execute(ctx) {
    const expression = ctx.options.getString("latex");
    await ctx.defer();

    try {
      await ctx.client.services.renderMath(ctx.channel, { expression, author: ctx.author });
    } catch (error) {
      if (!(error instanceof LatexInputError)) throw error;
      return ctx.reply({
        content: `I couldn't render that LaTeX: ${error.message.slice(0, 500)}`,
        allowedMentions: { parse: [] },
      });
    }
    await ctx.reply("Sent your LaTeX message!");
  },
};
