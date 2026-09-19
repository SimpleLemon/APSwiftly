"use strict";

const { httpJson } = require("../../../src/utils/http");

module.exports = {
  name: "lulcat",
  aliases: ["lolcat"],
  info: {
    description: "Makes your text look cursed using lul cat language.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (ctx.rawArgs.length === 0) return ctx.send("Please enter a text.");

    const data = await httpJson(`https://api.popcat.xyz/lulcat?text=${encodeURIComponent(ctx.rawArgs)}`);
    if (!data || typeof data !== "object") {
      return ctx.send("Unable to generate the output. Please, try again later.");
    }

    await ctx.send({ content: String(data.text ?? ""), allowedMentions: { parse: [] } });
  },
};
