"use strict";

const { inspect } = require("node:util");
const discord = require("discord.js");

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function formatResult(value) {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  try {
    return inspect(value, { depth: 2 });
  } catch {
    return String(value);
  }
}

async function sendResult(ctx, text) {
  if (text.length >= 2000) {
    return ctx.send({ files: [{ attachment: Buffer.from(text, "utf8"), name: "output.txt" }] });
  }
  return ctx.send(`\`\`\`\n${text}\n\`\`\``);
}

function compile(code) {
  const params = ["client", "message", "interaction", "ctx", "db", "discord"];
  try {
    return new AsyncFunction(...params, `return (${code}\n);`);
  } catch {
    return new AsyncFunction(...params, code);
  }
}

module.exports = {
  name: "jseval",
  aliases: ["jse", "djseval", "djse"],
  info: {
    description: "Executes codes for testing (in discord.js only)",
    perms: ["`SendMessages`"],
    flags: ["`--return`"],
    dev: "true",
  },
  async execute(ctx) {
    if (!ctx.client.ownerIds.includes(ctx.authorId)) return;
    if (!ctx.rawArgs) return ctx.send("You need to evaluate something.");

    const returnResult = ctx.rawArgs.includes("--return") || ctx.rawArgs.includes("—return");
    const code = ctx.rawArgs.replaceAll("--return", "").replaceAll("—return", "").trim();

    const fn = compile(code);
    const result = await fn(ctx.client, ctx.message, ctx.interaction, ctx, ctx.db, discord);
    if (returnResult) await sendResult(ctx, formatResult(result));
  },
};
