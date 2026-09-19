"use strict";

const { PermissionFlagsBits } = require("discord.js");

/**
 * Port of the legacy `$alwaysExecute` auto-responder that replies with the
 * server prefix when the bot is mentioned. It has a 2s cooldown and only
 * replies where the bot can send messages.
 */
module.exports = {
  event: "alwaysExecute",
  async execute(ctx) {
    const { client, message } = ctx;
    if (!message?.guild) return;

    const me = message.guild.members.me;
    const permissions = message.channel?.permissionsFor(me);
    if (!permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) return;

    const content = message.content ?? "";
    const isMentioned = content.startsWith(`<@${client.user.id}>`) || content.startsWith(`<@!${client.user.id}>`);
    if (!isMentioned) return;

    const remaining = client.services.cooldowns.check("autopingreply", message.author.id, message.guild.id);
    if (remaining > 0) return;
    client.services.cooldowns.set("autopingreply", message.author.id, message.guild.id, 2000);

    const prefix = client.db.getGuildVar(message.guild.id, "prefix");
    await message.channel.send(`Hello! My Prefix in this server is \`${prefix}\`.`);
  },
};
