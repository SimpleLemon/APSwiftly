"use strict";

const { httpJson } = require("../../../src/utils/http");

module.exports = {
  name: "fact",
  info: {
    description: "Returns random facts.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const data = await httpJson("https://api.popcat.xyz/fact");
    if (!data || typeof data !== "object") {
      return ctx.send("Unable to fetch data for fact. Please, try again later.");
    }

    await ctx.send(String(data.fact ?? ""));
  },
};
