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
    name: "poll-set",
    aliases: ["set-poll", "setpoll", "pollset"],
    info: {
      description: "Setup polls.",
      perms: ["`SendMessages`", "`ManageChannels`"],
    },
    cooldown: {
      time: 5000,
      message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
    },
    async execute(ctx) {
      if (!ctx.hasPerms(PermissionFlagsBits.ManageChannels)) {
        return ctx.send("You do not have `ManageChannels` permission to use this.");
      }

      if (ctx.args.length === 0) {
        return ctx.send("Mention an channel or enter the channel id.");
      }

      const channel = findGuildChannel(ctx.guild, ctx.rawArgs);
      if (!channel) {
        return ctx.send(
          "Either you have not specified an channel or channel exists but outside of this server. Please mention an valid channel."
        );
      }

      if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
        return ctx.send("You must set either Text or Announcement channel as a Poll channel to use Polls feature.");
      }

      if (channel.id === String(ctx.getGuildVar("pollchannel"))) {
        return ctx.send("You already have set this channel for Polls. Please mention a different one instead.");
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

      ctx.setGuildVar("pollchannel", channel.id);
      await ctx.send(`Successfully set <#${channel.id}> as the Poll channel!`);
    },
  },
  {
    name: "poll-reset",
    aliases: ["reset-pollchannel", "resetpoll", "reset-poll", "pollreset"],
    info: {
      description: "Reset current channel used for Polls.",
      perms: ["`SendMessages`", "`ManageChannels`"],
    },
    cooldown: {
      time: 2000,
      message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
    },
    async execute(ctx) {
      if (!ctx.hasPerms(PermissionFlagsBits.ManageChannels)) {
        return ctx.send("You do not have `ManageChannels` permission to use this.");
      }

      if (String(ctx.getGuildVar("pollchannel")) === "none") {
        return ctx.send("There is no channel to reset currently.");
      }

      ctx.db.deleteGuildVar(ctx.guildId, "pollchannel");
      await ctx.send("Successfully reset Poll channel! Run `suggest-set` to set a channel again.");
    },
  },
  {
    name: "poll",
    aliases: ["createpoll", "startpoll"],
    info: {
      description: "Start a poll in this server (if setup).",
      perms: ["`SendMessages`", "`ManageMessages`", "`AddReactions`"],
      usage: "poll content/choice 1/choice 2",
    },
    cooldown: {
      time: 5000,
      message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
    },
    async execute(ctx) {
      if (!ctx.hasPerms(PermissionFlagsBits.ManageMessages)) {
        return ctx.send("You need to have `ManageMessages` permission to use this.");
      }

      const [content, choiceOne, choiceTwo] = ctx.rawArgs.split("/");
      if (!content || !choiceOne || !choiceTwo) {
        return ctx.send(
          [
            "Hey there! Your usage seems to be incorrect.",
            "",
            `A example of a usage should be \`${ctx.prefix}${ctx.command.info?.usage ?? "poll content/choice 1/choice 2"}\``,
          ].join("\n")
        );
      }

      if (content.length > 3570 && choiceOne.length > 200 && choiceTwo.length > 200) {
        return ctx.send(
          "Your Poll content cannot be longer than 3570 characters. Choice 1 and Choice 2 cannot also be longer than 200 characters"
        );
      }

      const channelId = String(ctx.getGuildVar("pollchannel"));
      if (channelId === "none") {
        return ctx.send(
          [
            "Hmm. There is no channel used to start a new Poll currently.",
            "For staff server, please run `poll-set` to set a channel.",
          ].join("\n")
        );
      }

      const pollChannel = ctx.guild.channels.cache.get(channelId);
      if (!pollChannel) {
        return ctx.send(
          "Hmm. The channel set for the Poll system seems to be deleted. The system will not function until a new channel is set through the `poll-set` command."
        );
      }

      if (!hasChannelPermissions(ctx.guild, pollChannel)) {
        return ctx.send(
          [
            `Hmm. Seems like i don't have the right permissions there. For server staff members, please ensure that i have the following for the channel <#${pollChannel.id}>:`,
            "`ViewChannel`",
            "`SendMessages`",
            "`AddReactions`",
          ].join("\n")
        );
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `Poll by ${ctx.author.username}`,
          iconURL: ctx.author.displayAvatarURL({ size: 4096, forceStatic: false }),
          url: `https://discord.com/users/${ctx.authorId}`,
        })
        .setDescription(`${content}\n\n1️⃣: **${choiceOne}**\n\n2️⃣: **${choiceTwo}**`)
        .setFooter({ text: "Poll started since" })
        .setTimestamp()
        .setColor(ctx.getVar("embedcolor"));

      await pollChannel.send(`Successfully sent your Poll to <#${pollChannel.id}>!`);

      const message = await pollChannel.send({ embeds: [embed] });
      await message.react("1️⃣");
      await message.react("2️⃣");
    },
  },
];
