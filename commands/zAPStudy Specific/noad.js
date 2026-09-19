"use strict";

const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "noad",
  info: {
    description: "Stop advertisements",
    perms: ["`ManageMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!",
  },
  async execute(ctx) {
    if (!ctx.hasPerms(PermissionFlagsBits.ManageMessages)) {
      return ctx.send("<:Cross:1346672729675403437> This Command is Only for Staff Members!");
    }

    const referenceId = ctx.message?.reference?.messageId ?? null;
    const referenced = referenceId ? await ctx.channel.messages.fetch(referenceId).catch(() => null) : null;

    await ctx.message.delete().catch(() => {});

    const content = [
      "# ⚠️ Advertisements are not allowed!",
      "- Do not promote any product, service, or have anyone DM you for them.",
      "- To partner or buy a paid promotion channel, DM <@!784527187453542440>.",
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
