"use strict";

const { ActivityType } = require("discord.js");

module.exports = {
  name: "setcustomstatus",
  aliases: ["scs", "customstatus"],
  info: {
    description: "Sets a custom status for the bot",
    perms: ["`SendMessages`"],
    flags: ["`--reset`"],
    dev: "true",
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (!ctx.client.ownerIds.includes(ctx.authorId)) return;

    const text = ctx.rawArgs;
    if (!text) {
      return ctx.send(
        "Please enter an text. You can also reset the current status by passing the flag `--reset` as first argument of the cmd."
      );
    }

    const lower = text.toLowerCase();
    if (lower.startsWith("--reset") || lower.startsWith("—reset")) {
      const hasCustomStatus = (ctx.client.user.presence?.activities ?? []).some(
        (activity) => activity.type === ActivityType.Custom
      );
      if (!hasCustomStatus) return ctx.send("There is no status to reset.");

      ctx.client.user.setPresence({ status: "online", activities: [] });
      return ctx.send("Status has been reset! You can set a status again if you would like to do so.");
    }

    if (text.length > 128) {
      return ctx.send("You can only have up to 128 characters for each custom status you set.");
    }

    ctx.client.user.setPresence({
      status: "online",
      activities: [{ name: text, type: ActivityType.Custom }],
    });
    return ctx.send("Status has been set! You can remove it by passing the flag `--reset` at the start of your message.");
  },
};
