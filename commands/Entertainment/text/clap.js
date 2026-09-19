"use strict";

function noMentionMessage(text) {
  return String(text)
    .replace(/(<#\d{17,19}>|<@!?\d{17,19}>|<@&\d{17,19}>)/g, "")
    .trim()
    .split(/ +/g)
    .join(" ");
}

function spaceclap(text) {
  return text.replaceAll(" ", " 👏 ");
}

function nonspaceclap(text) {
  return text.replaceAll("", " 👏 ");
}

module.exports = {
  name: "clap",
  info: {
    description: "Makes 👏 the 👏 text 👏 look 👏 like 👏 this",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const text = noMentionMessage(ctx.rawArgs);
    if (text.length === 0) return ctx.send("Please enter a text for it to get clapped.");

    const output = text.includes(" ") ? spaceclap(text) : nonspaceclap(text);
    await ctx.send(output);
  },
};
