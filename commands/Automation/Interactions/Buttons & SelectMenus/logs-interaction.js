"use strict";

const { ChannelType, PermissionFlagsBits } = require("discord.js");

const {
  permissionMessage,
  buildLoggingEmbed,
  buildLoggingComponents,
  buildMessageEventsEmbed,
  buildMessageEventsComponents,
  buildMemberEventsEmbed,
  buildMemberEventsComponents,
  buildServerEventsEmbed,
  buildServerEventsComponents,
  toggleModules,
} = require("../../../../src/services/logsMenu");

const FEATURES = {
  msg: {
    channelVar: "msgeventschannel",
    usedMessage: "This channel is already being used for Message Event logging!",
    payload: (ctx) => ({ embeds: [buildMessageEventsEmbed(ctx)], components: buildMessageEventsComponents(ctx) }),
  },
  member: {
    channelVar: "membereventschannel",
    usedMessage: "This channel is already being used for Member Event logging!",
    payload: (ctx) => ({ embeds: [buildMemberEventsEmbed(ctx)], components: buildMemberEventsComponents(ctx) }),
  },
  server: {
    channelVar: "servereventschannel",
    usedMessage: "This channel is already being used for Server Event logging!",
    payload: (ctx) => ({ embeds: [buildServerEventsEmbed(ctx)], components: buildServerEventsComponents(ctx) }),
  },
};

function ownerMismatch(ctx) {
  return ctx.parts[1] !== ctx.authorId;
}

function notForYou(ctx) {
  return ctx.reply("This interaction is not for you.", { flags: 64 });
}

function homePayload(ctx) {
  return { embeds: [buildLoggingEmbed(ctx, "Logging Menu")], components: buildLoggingComponents(ctx) };
}

async function resolveChannel(ctx, channelId) {
  return ctx.guild.channels.cache.get(channelId) ?? (await ctx.guild.channels.fetch(channelId).catch(() => null));
}

async function canUseChannel(channel) {
  const me = channel.guild.members.me ?? (await channel.guild.members.fetchMe().catch(() => null));
  return Boolean(channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]));
}

async function setChannel(ctx, feature) {
  if (ownerMismatch(ctx)) return notForYou(ctx);

  const selected = ctx.values[0];
  const channel = await resolveChannel(ctx, selected);
  if (!channel) {
    return ctx.reply("The channel you chose does not exists.\nPlease set a valid channel that exists in this server.", {
      flags: 64,
    });
  }

  if (channel.type !== ChannelType.GuildText) {
    return ctx.reply("Only Text Channels are supported at this time.", { flags: 64 });
  }

  if (selected === ctx.getGuildVar(feature.channelVar)) {
    return ctx.reply(feature.usedMessage, { flags: 64 });
  }

  if (!(await canUseChannel(channel))) {
    return ctx.reply(permissionMessage(selected), { flags: 64 });
  }

  ctx.setGuildVar(feature.channelVar, selected);
  await ctx.update(feature.payload(ctx));
}

async function resetChannel(ctx, feature) {
  if (ownerMismatch(ctx)) return notForYou(ctx);

  const current = ctx.getGuildVar(feature.channelVar);
  if (!current || current === "none") {
    return ctx.reply("There's no channel to reset.", { flags: 64 });
  }

  ctx.db.deleteGuildVar(ctx.guildId, feature.channelVar);
  await ctx.update(feature.payload(ctx));
}

async function updateModules(ctx, kind, feature) {
  if (ownerMismatch(ctx)) return notForYou(ctx);
  toggleModules(ctx, kind);
  await ctx.update(feature.payload(ctx));
}

module.exports = [
  {
    component: "button",
    customId: "setuplogshome",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(homePayload(ctx));
    },
  },
  {
    component: "select",
    customId: "setuplogsmenu",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const value = ctx.values[0];
      if (value === "msgeventlogs") {
        await ctx.update(FEATURES.msg.payload(ctx));
      } else if (value === "servereventlogs") {
        await ctx.update(FEATURES.server.payload(ctx));
      } else if (value === "membereventlogs") {
        await ctx.update(FEATURES.member.payload(ctx));
      }
    },
  },
  {
    component: "select",
    customId: "msgeventchannelsetupmenu",
    async execute(ctx) {
      await setChannel(ctx, FEATURES.msg);
    },
  },
  {
    component: "button",
    customId: "msgeventresetchannel",
    async execute(ctx) {
      await resetChannel(ctx, FEATURES.msg);
    },
  },
  {
    component: "select",
    customId: "msgeventsetupmenu",
    async execute(ctx) {
      await updateModules(ctx, "msg", FEATURES.msg);
    },
  },
  {
    component: "select",
    customId: "membereventchannelsetupmenu",
    async execute(ctx) {
      await setChannel(ctx, FEATURES.member);
    },
  },
  {
    component: "button",
    customId: "membereventresetchannel",
    async execute(ctx) {
      await resetChannel(ctx, FEATURES.member);
    },
  },
  {
    component: "select",
    customId: "membereventsetupmenu",
    async execute(ctx) {
      await updateModules(ctx, "member", FEATURES.member);
    },
  },
  {
    component: "select",
    customId: "servereventchannelsetupmenu",
    async execute(ctx) {
      await setChannel(ctx, FEATURES.server);
    },
  },
  {
    component: "button",
    customId: "servereventresetchannel",
    async execute(ctx) {
      await resetChannel(ctx, FEATURES.server);
    },
  },
  {
    component: "select",
    customId: "servereventsetupmenu",
    async execute(ctx) {
      await updateModules(ctx, "server", FEATURES.server);
    },
  },
];
