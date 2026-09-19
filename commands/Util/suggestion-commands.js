"use strict";

const { ChannelType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const REQUIRED_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.AddReactions,
];

function findGuildChannel(guild, resolver) {
  if (!resolver) return null;
  const query = String(resolver).toLowerCase();
  return (
    guild.channels.cache.find(
      (channel) =>
        channel.name.toLowerCase() === query ||
        channel.id === resolver ||
        channel.toString() === resolver
    ) ?? null
  );
}

function hasChannelPermissions(guild, channel) {
  const me = guild.members.me;
  if (!me) return false;
  const permissions = channel.permissionsFor(me);
  return Boolean(permissions?.has(REQUIRED_PERMISSIONS));
}

module.exports = [
  {
    name: "suggest-set",
    aliases: "suggestion-set",
    info: {
      description: "Setup suggestions.",
      perms: ["`SendMessages`", "`ManageChannels`"],
      usage: "suggest-set channel-name/channel ID or <#channel ID>",
    },
    cooldown: {
      time: 3000,
      message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
    },
    async execute(ctx) {
      if (!ctx.hasPerms(PermissionFlagsBits.ManageChannels)) {
        return ctx.send("You do not have `ManageChannels` permission to use this.");
      }

      if (ctx.args.length === 0) {
        return ctx.send(
          [
            "Please set an channel.",
            `Usage: \`${ctx.prefix}${ctx.command.info?.usage ?? "suggest-set channel-name/channel ID or <#channel ID>"}\``,
          ].join("\n")
        );
      }

      const channel = findGuildChannel(ctx.guild, ctx.rawArgs);
      if (!channel) {
        return ctx.send(
          "Either you have not specified an channel or channel exists but outside of this server. Please mention an valid channel."
        );
      }

      if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
        return ctx.send("You must set either Text or Announcement channel as a Suggestion channel to use Suggestions feature.");
      }

      if (channel.id === String(ctx.getGuildVar("suggestionchannel"))) {
        return ctx.send("You already have set this channel for Suggestions. Please mention a different one instead.");
      }

      if (!hasChannelPermissions(ctx.guild, channel)) {
        return ctx.send(
          [
            "Hmm. Seems like i don't have permissions there, please ensure that i have the following for this channel:",
            "`ViewChannel`",
            "`SendMessages`",
            "`AddReactions`",
          ].join("\n")
        );
      }

      ctx.setGuildVar("suggestionchannel", channel.id);
      await ctx.send(`Successfully set <#${channel.id}> as the suggestion channel!`);
    },
  },
  {
    name: "suggest-reset",
    info: {
      description: "Reset current channel used for suggestions.",
      perms: ["`SendMessages`", "`ManageChannels`"],
    },
    cooldown: {
      time: 3000,
      message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
    },
    async execute(ctx) {
      if (!ctx.hasPerms(PermissionFlagsBits.ManageChannels)) {
        return ctx.send("You do not have `ManageChannels` permission to use this.");
      }

      if (String(ctx.getGuildVar("suggestionchannel")) === "none") {
        return ctx.send("There is no channel set to reset.");
      }

      ctx.db.deleteGuildVar(ctx.guildId, "suggestionchannel");
      await ctx.send("Successfully reset suggestion channel! Run `suggest-set` to set a channel again.");
    },
  },
  {
    name: "suggest",
    info: {
      description: "Starts a suggestion in this server (if the feature is setup).",
      perms: ["`SendMessages`", "`AddReactions`"],
    },
    cooldown: {
      time: 4000,
      message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
    },
    async execute(ctx) {
      const [title, description] = ctx.rawArgs.split("/");
      if (!title || !description) {
        return ctx.send(
          [
            "Hey there! Your usage seems to be wrong. Make sure it's correct",
            "",
            `A example of usage should be \`${ctx.prefix}suggest title/description\`.`,
          ].join("\n")
        );
      }

      if (title.length > 160 && description.length > 3950) {
        return ctx.send(
          "You can only add up to 160 characters for a title and 3950 characters for a description of the suggestion."
        );
      }

      const channelId = String(ctx.getGuildVar("suggestionchannel"));
      if (channelId === "none") {
        return ctx.send(
          [
            "Hmm. There is no channel used to send Suggestion currently.",
            "For staff server, please run `suggest-set` to set a channel.",
          ].join("\n")
        );
      }

      const suggestionChannel = ctx.guild.channels.cache.get(channelId);
      if (!suggestionChannel) {
        return ctx.send(
          "Hmm. the channel set for the Suggestion system seems to be deleted. The system will not function until a new channel is set from `suggest-set`."
        );
      }

      if (!hasChannelPermissions(ctx.guild, suggestionChannel)) {
        return ctx.send(
          [
            `Hmm. Seems like i don't have the right permissions there.  For server staff members, please ensure that i have the following for the channel <#${suggestionChannel.id}>:`,
            "`ViewChannel`",
            "`SendMessages`",
            "`AddReactions`",
          ].join("\n")
        );
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `Suggestion by ${ctx.author.username}`,
          iconURL: ctx.author.displayAvatarURL({ size: 4096, forceStatic: false }),
          url: `https://discord.com/users/${ctx.authorId}`,
        })
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: "Suggestion created since" })
        .setTimestamp()
        .setColor(ctx.getVar("embedcolor"));

      await suggestionChannel.send(`Successfully sent your suggestion to <#${suggestionChannel.id}>!`);

      const message = await suggestionChannel.send({ embeds: [embed] });
      await message.react("⬆️");
      await message.react("⬇️");
    },
  },
];
