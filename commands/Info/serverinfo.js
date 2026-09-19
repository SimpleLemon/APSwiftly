"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } = require("discord.js");

const VERIFICATION_LEVELS = {
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Highest",
};

const CONTENT_FILTERS = {
  0: "Disabled",
  1: "Medium",
  2: "High",
};

const CHANNEL_TYPES = {
  Text: ChannelType.GuildText,
  Voice: ChannelType.GuildVoice,
  Announcement: ChannelType.GuildAnnouncement,
  Forum: ChannelType.GuildForum,
  Category: ChannelType.GuildCategory,
};

module.exports = {
  name: "serverinfo",
  aliases: ["server", "si", "guild", "guildinfo"],
  info: {
    description: "Returns information about this server.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const { guild } = ctx;

    let members = guild.members.cache;
    try {
      members = await guild.members.fetch();
    } catch {}

    const bots = members.filter((member) => member.user.bot).size;
    const serverImage = guild.iconURL({ size: 4096, forceStatic: false }) ?? ctx.client.user.defaultAvatarURL;
    const owner =
      ctx.client.users.cache.get(guild.ownerId) ??
      (await ctx.client.users.fetch(guild.ownerId).catch(() => null));
    const channelCount = (type) => guild.channels.cache.filter((channel) => channel.type === type).size;

    const embed = new EmbedBuilder()
      .setAuthor({ name: guild.name, iconURL: serverImage, url: serverImage })
      .setTitle("Server Info")
      .addFields(
        { name: "Verification Level", value: VERIFICATION_LEVELS[guild.verificationLevel] ?? "None" },
        {
          name: "Other",
          value: [
            `**Created on:** <t:${Math.trunc(guild.createdTimestamp / 1000)}:f>`,
            `**Content Filter:** ${CONTENT_FILTERS[guild.explicitContentFilter] ?? "Disabled"}`,
            `**Server ID:** ${guild.id}`,
          ].join("\n"),
        },
        {
          name: "General",
          value: [
            `**Roles:** ${guild.roles.cache.size}`,
            `**Emojis:** ${guild.emojis.cache.size}`,
            `**Server Boosts:** ${guild.premiumSubscriptionCount ?? 0}`,
            `**Server owner:** ${owner?.username ?? "Unknown"} (\`${guild.ownerId}\`)`,
          ].join("\n"),
        },
        {
          name: "Channels",
          value: [
            `**Total:** ${guild.channels.cache.size}`,
            `**Text:** ${channelCount(CHANNEL_TYPES.Text)}`,
            `**Voice:** ${channelCount(CHANNEL_TYPES.Voice)}`,
            `**Announcement:** ${channelCount(CHANNEL_TYPES.Announcement)}`,
            `**Forum:** ${channelCount(CHANNEL_TYPES.Forum)}`,
            `**Categories:** ${channelCount(CHANNEL_TYPES.Category)}`,
          ].join("\n"),
        },
        {
          name: "Members",
          value: [
            `**Total:** ${members.size}`,
            `**Humans:** ${members.size - bots}`,
            `**Bots:** ${bots}`,
          ].join("\n"),
        }
      )
      .setThumbnail(serverImage)
      .setColor(ctx.getVar("embedcolor"));

    const components = [];
    if (guild.description) {
      components.push(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Description")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`viewserverdescription_${ctx.authorId}`)
        )
      );
    }

    await ctx.send({ embeds: [embed], components });
  },
};
