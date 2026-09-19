"use strict";

const { httpJson } = require("../../../src/utils/http");

function onepart(joke) {
  return String(joke ?? "");
}

function twopart(joke) {
  return `Setup: ${String(joke.setup ?? "")}\nDelivery: ${String(joke.delivery ?? "")}`;
}

module.exports = {
  name: "joke",
  aliases: ["jokes"],
  info: {
    description: "Returns random jokes.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const data = await httpJson(
      "https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&safe-mode"
    );
    if (!data || typeof data !== "object") {
      return ctx.send("Unable to fetch data for jokes. Please, try again later.");
    }

    const content = data.joke ? onepart(data.joke) : twopart(data);
    await ctx.send(content);
  },
};
