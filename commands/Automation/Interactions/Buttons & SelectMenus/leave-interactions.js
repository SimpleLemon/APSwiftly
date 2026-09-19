"use strict";

const {
  ActionRowBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const {
  MENUS,
  permissionMessage,
  validateHex,
  buildHomeEmbed,
  buildHomeComponents,
  buildSettingsEmbed,
  buildSettingsComponents,
  buildChannelSetupEmbed,
  buildChannelSetupComponents,
  buildMessageEmbed,
  buildMessageComponents,
  buildMessageTypeEmbed,
  buildMessageTypeComponents,
  buildPlaceholdersEmbed,
  buildPlaceholdersComponents,
} = require("../../../../src/services/welcomeMenu");

const KIND = "leave";
const MENU = MENUS[KIND];

function ownerMismatch(ctx) {
  return ctx.parts[1] !== ctx.authorId;
}

function notForYou(ctx) {
  return ctx.reply("This interaction is not for you.", { flags: 64 });
}

function homePayload(ctx) {
  return { embeds: [buildHomeEmbed(ctx, KIND)], components: buildHomeComponents(ctx, KIND) };
}

function settingsPayload(ctx) {
  return { embeds: [buildSettingsEmbed(ctx, KIND)], components: buildSettingsComponents(ctx, KIND) };
}

function channelPayload(ctx) {
  return { embeds: [buildChannelSetupEmbed(ctx, KIND)], components: buildChannelSetupComponents(ctx, KIND) };
}

function messagePayload(ctx) {
  return { embeds: [buildMessageEmbed(ctx, KIND)], components: buildMessageComponents(ctx, KIND) };
}

function messageTypePayload(ctx) {
  return { embeds: [buildMessageTypeEmbed(ctx, KIND)], components: buildMessageTypeComponents(ctx, KIND) };
}

function placeholdersPayload(ctx) {
  return { embeds: [buildPlaceholdersEmbed(ctx, KIND)], components: buildPlaceholdersComponents(ctx, KIND) };
}

async function resolveChannel(ctx, channelId) {
  return ctx.guild.channels.cache.get(channelId) ?? (await ctx.guild.channels.fetch(channelId).catch(() => null));
}

async function canUseChannel(channel) {
  const me = channel.guild.members.me ?? (await channel.guild.members.fetchMe().catch(() => null));
  return Boolean(channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]));
}

module.exports = [
  {
    component: "button",
    customId: "leavehomebutton",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(homePayload(ctx));
    },
  },
  {
    component: "button",
    customId: "toggleleave",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const currentlyOn = ctx.getGuildVar(MENU.systemVar) === "on";
      ctx.setGuildVar(MENU.systemVar, currentlyOn ? "off" : "on");

      await ctx.update(homePayload(ctx));
      await ctx.followUp(currentlyOn ? MENU.toggleOff : MENU.toggleOn, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "leavesettings",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(settingsPayload(ctx));
    },
  },
  {
    component: "button",
    customId: "leavechannelbutton",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(channelPayload(ctx));
    },
  },
  {
    component: "select",
    customId: "leavechannelmenusetup",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const selected = ctx.values[0];
      const channel = await resolveChannel(ctx, selected);
      if (!channel) {
        return ctx.reply(MENU.channelMissing, { flags: 64 });
      }

      if (selected === ctx.getGuildVar(MENU.channelVar)) {
        return ctx.reply(MENU.channelUsed, { flags: 64 });
      }

      if (!(await canUseChannel(channel))) {
        return ctx.reply(permissionMessage(selected), { flags: 64 });
      }

      ctx.setGuildVar(MENU.channelVar, selected);

      await ctx.update(channelPayload(ctx));
      await ctx.followUp(MENU.channelSet(selected), { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "leaveresetchannel",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const current = ctx.getGuildVar(MENU.channelVar);
      if (!current || current === "none") {
        return ctx.reply("There's no channel to reset.", { flags: 64 });
      }

      ctx.db.deleteGuildVar(ctx.guildId, MENU.channelVar);

      await ctx.update(channelPayload(ctx));
      await ctx.followUp("Channel has been reset!", { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "leavemessagebutton",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(messagePayload(ctx));
    },
  },
  {
    component: "button",
    customId: "leavesetmsgbutton",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const isEmbed = ctx.getGuildVar(MENU.typeVar) === "embed";
      const modal = new ModalBuilder()
        .setTitle("Message to use")
        .setCustomId(isEmbed ? MENU.ids.embedModal : MENU.ids.textModal);

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("textInput")
            .setLabel("Custom message to use")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder(MENU.messagePlaceholder)
            .setMaxLength(3750)
            .setValue(String(ctx.getGuildVar(MENU.messageVar) ?? ""))
        )
      );

      if (isEmbed) {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("hexInput")
              .setLabel("Embed color to use")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder("e.g, #9B59B6")
              .setMaxLength(7)
              .setValue(String(ctx.getGuildVar(MENU.embedColorVar) ?? ""))
          )
        );
      }

      await ctx.showModal(modal);
    },
  },
  {
    component: "modal",
    customId: "leavetextmodal",
    async execute(ctx) {
      ctx.setGuildVar(MENU.messageVar, ctx.interaction.fields.getTextInputValue("textInput"));
      await ctx.reply(MENU.setMessageReply, { flags: 64 });
    },
  },
  {
    component: "modal",
    customId: "leaveembedmodal",
    async execute(ctx) {
      const hex = ctx.interaction.fields.getTextInputValue("hexInput");
      const error = validateHex(hex);
      if (error) {
        return ctx.reply(error, { flags: 64 });
      }

      ctx.setGuildVar(MENU.embedColorVar, hex);
      ctx.setGuildVar(MENU.messageVar, ctx.interaction.fields.getTextInputValue("textInput"));

      await ctx.reply(MENU.setMessageReply, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "leavemessagetypebutton",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(messageTypePayload(ctx));
    },
  },
  {
    component: "button",
    customId: "toggleleavemessagetype",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const next = ctx.getGuildVar(MENU.typeVar) === "text" ? "embed" : "text";
      ctx.setGuildVar(MENU.typeVar, next);

      await ctx.update(messageTypePayload(ctx));
      await ctx.followUp(next === "embed" ? MENU.typeEmbed : MENU.typeText, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "leavetestmessagebutton",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const channelId = ctx.getGuildVar(MENU.channelVar);
      if (!channelId || channelId === "none") {
        return ctx.reply(MENU.testMissing, { flags: 64 });
      }

      const channel = await resolveChannel(ctx, channelId);
      if (!channel || !channel.isTextBased()) {
        return ctx.reply(MENU.testDeleted, { flags: 64 });
      }

      if (!(await canUseChannel(channel))) {
        return ctx.reply(permissionMessage(channelId), { flags: 64 });
      }

      await ctx.reply(MENU.testReply, { flags: 64 });
      await channel.send(
        ctx.client.services.welcomer.buildLeavePayload(ctx.client, {
          guild: ctx.guild,
          user: ctx.author,
          member: ctx.member,
          test: true,
        })
      );
    },
  },
  {
    component: "button",
    customId: "leaveplaceholders",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(placeholdersPayload(ctx));
    },
  },
];
