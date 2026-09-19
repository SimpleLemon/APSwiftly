"use strict";

const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "serverlist",
  aliases: "guildlist",
  info: {
    description: "Returns list of servers the bot is in",
    perms: ["`SendMessages`"],
    dev: "true",
  },
  async execute(ctx) {
    if (!ctx.client.ownerIds.includes(ctx.authorId)) return;

    if (!ctx.channel.permissionsFor(ctx.client.user)?.has(PermissionFlagsBits.AttachFiles)) {
      return ctx.send(
        "I must have `AttachFiles` permission in order to proceed in this channel. Please, grant me the permission and try again."
      );
    }

    const sent = await ctx.send("Please wait.. Getting the list..");
    const content = ctx.client.guilds.cache.map((guild) => `* ${guild.name} - ${guild.id}`).join("\n");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await sent.edit({ content: "", files: [{ attachment: Buffer.from(content, "utf8"), name: "allservers.md" }] });
  },
};
