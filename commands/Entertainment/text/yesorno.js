"use strict";

const { pick } = require("../../../src/utils/random");

module.exports = {
  name: "yesorno",
  info: {
    description: "Randomly Returns either `yes` or `no`.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (ctx.rawArgs.length === 0) return ctx.send("Please Type something.");
    if (ctx.rawArgs.length > 200) return ctx.send("Your question can't be longer than 200 characters");

    const answer = pick(["yes", "no"]);
    await ctx.send({
      content: `> ${ctx.rawArgs}\n*${answer}*`,
      allowedMentions: { parse: [] },
    });
  },
};
