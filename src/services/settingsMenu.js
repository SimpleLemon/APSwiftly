"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const SETTINGS = {
  autoreply: {
    title: "Auto Reply",
    description: [
      "Having this option enabled will allow the bot to respond by pinging, which will let you know on what prefix it currently uses in this server.",
      "",
      "Disable this If It's purposefully used for spamming.",
    ].join("\n"),
    variable: "autopingreply",
    label: "Auto Reply",
    optionDescription: "Automatically reply to pings!",
    onMessage: "From now on, I will reply by pings!",
    offMessage: "From now on, I will no longer reply by pings!",
  },
  includebots: {
    title: "Include Bots",
    description: [
      "This option let's you decide whether or not bots should be included in message logs.",
      "",
      "By default, this is enabled but you can choose to disable it for whatever reason.",
    ].join("\n"),
    variable: "includebots",
    label: "Include Bots",
    optionDescription: "Whether or not to include bots in message logs.",
    onMessage: "From now on, Bots will be included in logs!",
    offMessage: "From now on, Bots will no longer be included in logs!",
  },
  anonymous: {
    title: "Anonymous",
    description: [
      "This option allows moderator names to not be revealed in Ban logs!",
      "",
      "For security reasons, this feature is only exclusive to Ban logs!",
      "",
      "-# This does not apply to bots by default",
    ].join("\n"),
    variable: "anonymous",
    label: "Anonymous",
    optionDescription: "Hide moderator names being revealed",
    onMessage: "Anonymous has been enabled!",
    offMessage: "Anonymous has been disabled!",
  },
};

const ORDER = ["autoreply", "includebots", "anonymous"];

function isEnabled(value) {
  return value === "on" || value === true;
}

function buildSettingsMenu(ctx) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`settingsmenu_${ctx.authorId}`)
      .setPlaceholder("Select a option")
      .addOptions(
        ORDER.map((key) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(SETTINGS[key].label)
            .setValue(key)
            .setDescription(SETTINGS[key].optionDescription)
        )
      )
  );
}

function buildSettingsEmbed(ctx, key) {
  const setting = SETTINGS[key];
  const current = ctx.getGuildVar(setting.variable);
  return ctx
    .embed(setting.description, { title: setting.title })
    .addFields({ name: "**Current Setup**", value: `**${setting.label}**: \`${isEnabled(current) ? "Enabled" : "Disabled"}\`` });
}

function buildToggleRow(ctx, key) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Toggle")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`${key}toggle_${ctx.authorId}`)
  );
}

module.exports = { SETTINGS, ORDER, buildSettingsMenu, buildSettingsEmbed, buildToggleRow, isEnabled };
