"use strict";

const { PermissionFlagsBits } = require("discord.js");

const MENTION_TOKENS = ["<@", "<@!", "<@&", "<#", "@", "<#!"];

module.exports = [
  {
    name: "prefix",
    info: {
      description: "View or change current prefix of the bot in this server.",
      perms: ["`SendMessages`", "`ManageGuild` (when changing prefix)"],
      usage: "prefix <new prefix>",
    },
    cooldown: {
      time: 2000,
      message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
    },
    async execute(ctx) {
      const current = String(ctx.getGuildVar("prefix"));
      const newPrefix = ctx.rawArgs;

      if (!newPrefix) {
        return ctx.send(
          `Prefix: \`${current}\` \nUsage to change prefix: \`${current}${ctx.command.info?.usage ?? ""}\``
        );
      }

      if (MENTION_TOKENS.some((token) => newPrefix.includes(token))) {
        return ctx.send("Why would i do that? I don't want to disturb people! o(TヘTo)");
      }

      if (!ctx.hasPerms(PermissionFlagsBits.ManageGuild)) {
        return ctx.send("You do not have `ManageGuild` permission to use this.");
      }

      if (newPrefix.length > 5) {
        return ctx.send("Prefix can't be longer than 5 characters.");
      }

      if (current === newPrefix) {
        return ctx.send("This prefix is already in use.");
      }

      ctx.setGuildVar("prefix", newPrefix);
      await ctx.send(`Changed prefix from \`${current}\` to \`${newPrefix}\`.`);
    },
  },
  {
    name: "prefix-reset",
    aliases: "reset-prefix",
    info: {
      description: "Resets the prefix to it's default state in this server.",
      perms: ["`SendMessages`", "`ManageGuild`"],
    },
    cooldown: {
      time: 2000,
      message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
    },
    async execute(ctx) {
      if (!ctx.hasPerms(PermissionFlagsBits.ManageGuild)) {
        return ctx.send("You do not have `ManageGuild` permission to use this.");
      }

      if (String(ctx.getGuildVar("prefix")) === String(ctx.getVar("originalprefix"))) {
        return ctx.send("Cannot reset when the prefix is default.");
      }

      ctx.db.deleteGuildVar(ctx.guildId, "prefix");
      await ctx.send("The prefix has been successfully reset. <3");
    },
  },
];
