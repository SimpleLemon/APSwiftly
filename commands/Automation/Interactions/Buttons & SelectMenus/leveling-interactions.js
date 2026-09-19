"use strict";

const { PermissionFlagsBits } = require("discord.js");

const {
  permissionMessage,
  buildHomeEmbed,
  buildHomeComponents,
  buildSettingsEmbed,
  buildSettingsComponents,
  buildMessageEmbed,
  buildMessageComponents,
  buildChannelSetupEmbed,
  buildChannelSetupComponents,
  buildExclusionsEmbed,
  buildExclusionsComponents,
  buildExcludeChannelsEmbed,
  buildExcludeChannelsComponents,
  buildExcludeCategoriesEmbed,
  buildExcludeCategoriesComponents,
  buildResetOnLeaveEmbed,
  buildResetOnLeaveComponents,
  buildPlaceholdersEmbed,
  buildPlaceholdersComponents,
  buildResetConfirmEmbed,
  buildResetConfirmComponents,
  buildSetMessageModal,
} = require("../../../../src/services/levelingMenu");

const { resetLeveling } = require("../../../../commands/Automation/Awaited/levelingresets");
const { applyTemplate } = require("../../../../src/utils/templates");

function ownerMismatch(ctx) {
  return ctx.parts[1] !== ctx.authorId;
}

function notForYou(ctx) {
  return ctx.reply("This interaction is not for you.", { flags: 64 });
}

function homePayload(ctx) {
  return { embeds: [buildHomeEmbed(ctx)], components: buildHomeComponents(ctx) };
}

function settingsPayload(ctx) {
  return { embeds: [buildSettingsEmbed(ctx)], components: buildSettingsComponents(ctx) };
}

function messagePayload(ctx) {
  return { embeds: [buildMessageEmbed(ctx)], components: buildMessageComponents(ctx) };
}

function channelPayload(ctx) {
  return { embeds: [buildChannelSetupEmbed(ctx)], components: buildChannelSetupComponents(ctx) };
}

function exclusionsPayload(ctx) {
  return { embeds: [buildExclusionsEmbed(ctx)], components: buildExclusionsComponents(ctx) };
}

function channelsPayload(ctx) {
  return { embeds: [buildExcludeChannelsEmbed(ctx)], components: buildExcludeChannelsComponents(ctx) };
}

function categoriesPayload(ctx) {
  return { embeds: [buildExcludeCategoriesEmbed(ctx)], components: buildExcludeCategoriesComponents(ctx) };
}

function resetOnLeavePayload(ctx) {
  return { embeds: [buildResetOnLeaveEmbed(ctx)], components: buildResetOnLeaveComponents(ctx) };
}

function placeholdersPayload(ctx) {
  return { embeds: [buildPlaceholdersEmbed(ctx)], components: buildPlaceholdersComponents(ctx) };
}

async function resolveChannel(ctx, channelId) {
  return ctx.guild.channels.cache.get(channelId) ?? (await ctx.guild.channels.fetch(channelId).catch(() => null));
}

async function canUseChannel(channel) {
  const me = channel.guild.members.me ?? (await channel.guild.members.fetchMe().catch(() => null));
  return Boolean(channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]));
}

async function toggleExclusionList(ctx, variable, payload) {
  const values = ctx.values.filter(Boolean);
  ctx.setGuildVar(variable, values.length ? values.join(", ") : "none");
  await ctx.update(payload(ctx));
  await ctx.followUp("Successfully updated the list!", { flags: 64 });
}

async function resetExclusionList(ctx, variable, payload) {
  const current = ctx.getGuildVar(variable);
  if (!current || current === "none") {
    return ctx.reply("There's nothing to reset.", { flags: 64 });
  }

  ctx.db.deleteGuildVar(ctx.guildId, variable);
  await ctx.update(payload(ctx));
  await ctx.followUp("Successfully reset the current list!", { flags: 64 });
}

module.exports = [
  {
    component: "button",
    customId: "levelinghomepage",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(homePayload(ctx));
    },
  },
  {
    component: "button",
    customId: "toggleleveling",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const currentlyOn = ctx.getGuildVar("levelsystem") === "on";
      const next = currentlyOn ? "off" : "on";
      ctx.setGuildVar("levelsystem", next);

      await ctx.update(homePayload(ctx));
      await ctx.followUp(next === "on" ? "Successfully enabled Leveling!" : "Successfully disabled Leveling!", {
        flags: 64,
      });
    },
  },
  {
    component: "button",
    customId: "levelingreset",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      if (ctx.getGuildVar("levelsystem") !== "on") {
        return ctx.reply("Leveling must be enabled first.", { flags: 64 });
      }

      await ctx.reply(
        { embeds: [buildResetConfirmEmbed(ctx)], components: buildResetConfirmComponents() },
        { flags: 64 }
      );
    },
  },
  {
    component: "button",
    customId: "levelingresetconfirm",
    async execute(ctx) {
      if (ctx.getGuildVar("islevelingreset") !== "no") {
        return ctx.reply("Leveling is already reset in this server.", { flags: 64 });
      }

      resetLeveling(ctx.client, ctx.guildId);
      await ctx.update("Leveling has been reset!");
    },
  },
  {
    component: "button",
    customId: "levelingresetdeny",
    async execute(ctx) {
      await ctx.update("The current progress for all members will remain then.");
    },
  },
  {
    component: "button",
    customId: "levelingsettings",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(settingsPayload(ctx));
    },
  },
  {
    component: "button",
    customId: "levelingsettingmessage",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(messagePayload(ctx));
    },
  },
  {
    component: "button",
    customId: "enablelevelingmessage",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const currentlyOn = ctx.getGuildVar("levelmessagefeature") === "on";
      const next = currentlyOn ? "off" : "on";
      ctx.setGuildVar("levelmessagefeature", next);

      await ctx.update(messagePayload(ctx));
      await ctx.followUp(
        next === "on"
          ? "From now on, Level up messages will be sent by the bot!"
          : "From now on, Level up messages will no longer be sent by the bot",
        { flags: 64 }
      );
    },
  },
  {
    component: "button",
    customId: "levelingsetmsgmodal",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.showModal(buildSetMessageModal(ctx.getGuildVar("levelmessage")));
    },
  },
  {
    component: "modal",
    customId: "levelingsetmsgresult",
    async execute(ctx) {
      ctx.setGuildVar("levelmessage", ctx.interaction.fields.getTextInputValue("textInput"));
      await ctx.reply("Successfully set the Level up message!", { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "levelingchannelsetup",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(channelPayload(ctx));
    },
  },
  {
    component: "select",
    customId: "levelingchannelmenusetup",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const selected = ctx.values[0];
      const channel = await resolveChannel(ctx, selected);
      if (!channel) {
        return ctx.reply(
          "The channel you chose no longer exists in this server.\nPlease set a valid channel which exists inside this server.",
          { flags: 64 }
        );
      }

      if (selected === ctx.getGuildVar("levelingmessagechannel")) {
        return ctx.reply("This channel is already used for Level up messages. Please, set a different channel instead.", {
          flags: 64,
        });
      }

      if (!(await canUseChannel(channel))) {
        return ctx.reply(permissionMessage(selected), { flags: 64 });
      }

      ctx.setGuildVar("levelingmessagechannel", selected);
      await ctx.update(channelPayload(ctx));
      await ctx.followUp(`<#${selected}> will now be used for Level up messages!`, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "levelingresetchannel",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const current = ctx.getGuildVar("levelingmessagechannel");
      if (!current || current === "none") {
        return ctx.reply("There's no channel to reset.", { flags: 64 });
      }

      ctx.db.deleteGuildVar(ctx.guildId, "levelingmessagechannel");
      await ctx.update(channelPayload(ctx));
      await ctx.followUp("Channel has been reset!", { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "levelingtestmessage",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const channelId = ctx.getGuildVar("levelingmessagechannel");
      if (!channelId || channelId === "none") {
        return ctx.reply("There is no channel set to test the Level up message.\nPlease set a new channel first.", {
          flags: 64,
        });
      }

      const channel = await resolveChannel(ctx, channelId);
      if (!channel || !channel.isTextBased()) {
        return ctx.reply(
          "The channel used for Level up message seems to be deleted.\nCancelled sending the message as a result. Please set a new channel to fix this.",
          { flags: 64 }
        );
      }

      if (!(await canUseChannel(channel))) {
        return ctx.reply(permissionMessage(channelId), { flags: 64 });
      }

      const content = applyTemplate(ctx.getGuildVar("levelmessage"), {
        "<newlevel>": String(ctx.db.getUserVar(ctx.guildId, ctx.authorId, "level")),
        "<mention>": `<@${ctx.authorId}>`,
        "<username>": ctx.author.username,
        "<oldlevel>": String(ctx.db.getUserVar(ctx.guildId, ctx.authorId, "previouslevel")),
        "<Displayname>": ctx.member?.displayName ?? ctx.author.username,
      });

      await channel.send({
        content: `**This is a test Level up message! Please, ignore this!**\n${content}`,
        allowedMentions: { parse: ["users"] },
      });
      await ctx.reply("Successfully sent the message to the Level up channel for testing!", { flags: 64 });
    },
  },
  {
    component: "select",
    customId: "levelingotheroptionsmenu",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const value = ctx.values[0];
      if (value === "exclusions") {
        await ctx.update(exclusionsPayload(ctx));
      } else if (value === "resetonleave") {
        await ctx.update(resetOnLeavePayload(ctx));
      }
    },
  },
  {
    component: "button",
    customId: "levelingexclusionshome",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(exclusionsPayload(ctx));
    },
  },
  {
    component: "button",
    customId: "levelingexcludechannelssetting",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(channelsPayload(ctx));
    },
  },
  {
    component: "select",
    customId: "levelingexcludechannelmenusetup",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await toggleExclusionList(ctx, "levelingexcludedchannels", channelsPayload);
    },
  },
  {
    component: "button",
    customId: "levelingexcludechannelreset",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await resetExclusionList(ctx, "levelingexcludedchannels", channelsPayload);
    },
  },
  {
    component: "button",
    customId: "levelingexcludecategoriessetting",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(categoriesPayload(ctx));
    },
  },
  {
    component: "select",
    customId: "levelingexcludecategoriesmenusetup",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await toggleExclusionList(ctx, "levelingexcludedcategories", categoriesPayload);
    },
  },
  {
    component: "button",
    customId: "levelingexcludecategoriesreset",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await resetExclusionList(ctx, "levelingexcludedcategories", categoriesPayload);
    },
  },
  {
    component: "button",
    customId: "togglelevelingleaveonreset",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);

      const currentlyOn = ctx.getGuildVar("levelleaveonreset") === "on";
      const next = currentlyOn ? "off" : "on";
      ctx.setGuildVar("levelleaveonreset", next);

      await ctx.update(resetOnLeavePayload(ctx));
      await ctx.followUp(
        next === "on"
          ? "User's levels will now reset whenever they leave!"
          : "User's levels will no longer reset whenever they leave!",
        { flags: 64 }
      );
    },
  },
  {
    component: "button",
    customId: "levelingmsgplaceholders",
    async execute(ctx) {
      if (ownerMismatch(ctx)) return notForYou(ctx);
      await ctx.update(placeholdersPayload(ctx));
    },
  },
];
