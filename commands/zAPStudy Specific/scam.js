"use strict";

const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "scam",
  info: {
    description: "Stop scammers",
    perms: ["`ManageMessages`"],
  },
  async execute(ctx) {
    if (!ctx.hasPerms(PermissionFlagsBits.ManageMessages)) {
      return ctx.send("<:Cross:1346672729675403437> This Command is Only for Staff Members!");
    }

    const referenceId = ctx.message?.reference?.messageId ?? null;
    const referenced = referenceId ? await ctx.channel.messages.fetch(referenceId).catch(() => null) : null;

    await ctx.message.delete().catch(() => {});

    const content = [
      "# 💀 Get a real job.",
      "- Are you really trying to scam random people on the internet?",
      "- Consider reflecting on what you just did.",
      `-# <@!${referenced?.author?.id ?? ""}>`,
    ].join("\n");

    if (referenced) {
      await ctx.channel.send({ content, reply: { messageReference: referenced.id } });
      await referenced.delete().catch(() => {});
    } else {
      await ctx.send(content);
    }
  },
};
