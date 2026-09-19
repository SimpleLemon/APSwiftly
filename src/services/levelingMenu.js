"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const { renderList } = require("../utils/autolist");

const IDS = {
  homepage: "levelinghomepage",
  toggle: "toggleleveling",
  settings: "levelingsettings",
  reset: "levelingreset",
  resetConfirm: "levelingresetconfirm",
  resetDeny: "levelingresetdeny",
  settingMessage: "levelingsettingmessage",
  toggleMessage: "enablelevelingmessage",
  channelSetup: "levelingchannelsetup",
  channelSelect: "levelingchannelmenusetup",
  resetChannel: "levelingresetchannel",
  setMessageModal: "levelingsetmsgmodal",
  setMessageResult: "levelingsetmsgresult",
  testMessage: "levelingtestmessage",
  otherOptions: "levelingotheroptionsmenu",
  exclusionsHome: "levelingexclusionshome",
  excludeChannelsSetting: "levelingexcludechannelssetting",
  excludeChannelsSelect: "levelingexcludechannelmenusetup",
  excludeChannelsReset: "levelingexcludechannelreset",
  excludeCategoriesSetting: "levelingexcludecategoriessetting",
  excludeCategoriesSelect: "levelingexcludecategoriesmenusetup",
  excludeCategoriesReset: "levelingexcludecategoriesreset",
  toggleLeaveOnReset: "togglelevelingleaveonreset",
  placeholders: "levelingmsgplaceholders",
};

const HOME_DESCRIPTION = [
  "Leveling is a feature that let's members of the server have their levels and xp based on how much they have been active in the server.",
  "",
  'To get started, click on the "Toggle" button! To manage the settings regarding the said feature, press the "Settings" button.',
  "",
  "**Current Setup**",
].join("\n");

const MESSAGE_DESCRIPTION = [
  "This option is dedicated to changing current options for level up message. Choose an option to change.",
  "    ",
  'Press the "Toggle" button to enable/disable the Level up Message or use the other options alternatively to manage level up message settings.',
].join("\n");

const CHANNEL_DESCRIPTION = [
  "Choose a channel for Level up messages to be sent in. Use the select menu below for the channel to use!",
  "    ",
  "**Tip:** Unable to find the channel you're looking for? Try typing the channel name instead!",
].join("\n");

const EXCLUSIONS_DESCRIPTION = [
  "This category is dedicated to choosing on what should be excluded from allowing xp!",
  "",
  "To manage a specific setting, use any of the buttons below to do so!",
  "    ",
].join("\n");

const EXCLUDE_CHANNELS_DESCRIPTION = [
  "Use the dropdown menu below to select channels to exclude from xp. (You can add up to 10)!",
  "",
  "**Tip:** Unable to find the channel you're looking for? Try typing the channel name instead!",
].join("\n");

const EXCLUDE_CATEGORIES_DESCRIPTION = [
  "Use the dropdown menu below to select channel categories to exclude from xp. (You can add up to 10)!",
  "",
  "**Tip:** Unable to find the category you're looking for? Try typing the category name instead!",
].join("\n");

const RESET_ON_LEAVE_DESCRIPTION = [
  "This option let's you reset User's current level whenever they leave the server. ",
  "    ",
  "By default, this is disabled but you can choose to enable it if you want to do so.",
].join("\n");

const PLACEHOLDERS_DESCRIPTION =
  "Placeholders allows you to make your custom Level up message unique. Use the current ones available in this list!";

const PLACEHOLDERS_MEMBER = [
  "    `<username>` - Returns the member's username",
  "    `<Displayname>` - Returns the member's displayname",
  "    `<mention>` - Pings the member",
  "    ",
].join("\n");

const PLACEHOLDERS_LEVELING = [
  "    `<newlevel>` - Returns the new level of the member",
  "    `<oldlevel>` - Returns the previous level the member once had",
  "    ",
].join("\n");

function isEnabled(value) {
  return value === "on" || value === true;
}

function embed(ctx, description, { title, color } = {}) {
  const builder = new EmbedBuilder().setColor(color ?? ctx.getVar("embedcolor") ?? "#2A3759");
  if (title) builder.setTitle(title);
  if (description) builder.setDescription(description);
  return builder;
}

function formatChannel(value) {
  if (!value || value === "none") return "none";
  return `<#${value}> (\`${value}\`)`;
}

function permissionMessage(channelId) {
  return [
    `Hmm. Seems like i don't have the right permissions there. Please ensure that i have the following permissions for the channel <#${channelId}>:`,
    "`ViewChannel`",
    "`SendMessages`",
  ].join("\n");
}

function button(ctx, key, label, { style = ButtonStyle.Secondary, emoji } = {}) {
  const builder = new ButtonBuilder()
    .setCustomId(`${IDS[key]}_${ctx.authorId}`)
    .setLabel(label)
    .setStyle(style);
  if (emoji) builder.setEmoji(emoji);
  return builder;
}

function buildHomeEmbed(ctx) {
  const status = isEnabled(ctx.getGuildVar("levelsystem")) ? "Enabled" : "Disabled";
  return embed(ctx, `${HOME_DESCRIPTION}\n* ${status}`, { title: "Leveling" });
}

function buildHomeComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(
      button(ctx, "toggle", "Toggle", { emoji: "🔄" }),
      button(ctx, "settings", "Settings", { style: ButtonStyle.Danger }),
      button(ctx, "reset", "Reset", { emoji: "⚠️" })
    ),
  ];
}

/**
 * The prefix command used `$addButton`, which aoi.js executes bottom-up, so the
 * rendered order is the reverse of the source order (Settings, Toggle, Reset).
 */
function buildCommandHomeComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(
      button(ctx, "reset", "Reset", { emoji: "⚠️" }),
      button(ctx, "toggle", "Toggle", { emoji: "🔄" }),
      button(ctx, "settings", "Settings", { style: ButtonStyle.Danger })
    ),
  ];
}

function buildSettingsEmbed(ctx) {
  return embed(ctx, "Welcome to Leveling settings! Select a option to change.\n\n\n ", {
    title: "Leveling settings",
  }).addFields({
    name: "**Current Setup**",
    value: [
      `**Level up channel:** ${formatChannel(ctx.getGuildVar("levelingmessagechannel"))}`,
      `**Level up message:** \`${isEnabled(ctx.getGuildVar("levelmessagefeature")) ? "Enabled" : "Disabled"}\``,
    ].join("\n"),
  });
}

function buildSettingsComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`${IDS.otherOptions}_${ctx.authorId}`)
        .setPlaceholder("Other options")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions([
          {
            label: "Reset on Leave",
            value: "resetonleave",
            description: "Reset user's progress when they leave",
          },
          {
            label: "Exclusions",
            value: "exclusions",
            description: "Choose what to exclude from allowing xp",
          },
        ])
    ),
    new ActionRowBuilder().addComponents(
      button(ctx, "homepage", "Home", { emoji: "🏠" }),
      button(ctx, "settingMessage", "Message"),
      button(ctx, "placeholders", "Placeholders")
    ),
  ];
}

function currentSetupField(ctx) {
  return {
    name: "**Current Setup**",
    value: [
      `* **Level up channel:** ${formatChannel(ctx.getGuildVar("levelingmessagechannel"))}`,
      `* **Level up message:** \`${isEnabled(ctx.getGuildVar("levelmessagefeature")) ? "Enabled" : "Disabled"}\``,
    ].join("\n"),
  };
}

function buildMessageEmbed(ctx) {
  return embed(ctx, MESSAGE_DESCRIPTION, { title: "Level up Message" }).addFields(currentSetupField(ctx));
}

function buildMessageComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(
      button(ctx, "settings", "Go back", { emoji: "↩️" }),
      button(ctx, "toggleMessage", "Toggle", { emoji: "🔄" }),
      button(ctx, "channelSetup", "Set Channel"),
      button(ctx, "setMessageModal", "Set Message")
    ),
    new ActionRowBuilder().addComponents(button(ctx, "testMessage", "Test Message")),
  ];
}

function buildChannelSetupEmbed(ctx) {
  return embed(ctx, CHANNEL_DESCRIPTION, { title: "Channel Setup" }).addFields({
    name: "**Current Channel**",
    value: `* ${formatChannel(ctx.getGuildVar("levelingmessagechannel"))}`,
  });
}

function buildLevelingChannelSelect(ctx) {
  return new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`${IDS.channelSelect}_${ctx.authorId}`)
      .setPlaceholder("Select a channel to use.")
      .setMinValues(1)
      .setMaxValues(1)
      .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
  );
}

function buildChannelSetupComponents(ctx) {
  return [
    buildLevelingChannelSelect(ctx),
    new ActionRowBuilder().addComponents(
      button(ctx, "settingMessage", "Go back", { emoji: "↩️" }),
      button(ctx, "resetChannel", "Reset")
    ),
  ];
}

function buildExclusionsEmbed(ctx) {
  return embed(ctx, EXCLUSIONS_DESCRIPTION, { title: "Exclusions" });
}

function buildExclusionsComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(
      button(ctx, "settings", "Go back", { emoji: "↩️" }),
      button(ctx, "excludeChannelsSetting", "Channels"),
      button(ctx, "excludeCategoriesSetting", "Categories")
    ),
  ];
}

function buildExcludeChannelsEmbed(ctx) {
  return embed(ctx, EXCLUDE_CHANNELS_DESCRIPTION, { title: "Channels" }).addFields({
    name: "**Current Channel(s)**",
    value: renderList(ctx.client, ctx.guild, ctx.getGuildVar("levelingexcludedchannels"), "channels"),
  });
}

function existingChannels(ctx, variable) {
  const value = String(ctx.getGuildVar(variable) ?? "none");
  if (value === "none" || value === "") return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((id) => ctx.guild?.channels?.cache?.has(id))
    .slice(0, 10);
}

function buildExcludeChannelsSelect(ctx) {
  const builder = new ChannelSelectMenuBuilder()
    .setCustomId(`${IDS.excludeChannelsSelect}_${ctx.authorId}`)
    .setPlaceholder("Select channels.")
    .setMinValues(1)
    .setMaxValues(10)
    .setChannelTypes(ChannelType.GuildText);

  const defaults = existingChannels(ctx, "levelingexcludedchannels");
  if (defaults.length) builder.setDefaultChannels(defaults);
  return new ActionRowBuilder().addComponents(builder);
}

function buildExcludeChannelsComponents(ctx) {
  return [
    buildExcludeChannelsSelect(ctx),
    new ActionRowBuilder().addComponents(
      button(ctx, "exclusionsHome", "Go back", { emoji: "↩️" }),
      button(ctx, "excludeChannelsReset", "Reset")
    ),
  ];
}

function buildExcludeCategoriesEmbed(ctx) {
  return embed(ctx, EXCLUDE_CATEGORIES_DESCRIPTION, { title: "Categories" }).addFields({
    name: "**Current Categories**",
    value: renderList(ctx.client, ctx.guild, ctx.getGuildVar("levelingexcludedcategories"), "categories"),
  });
}

function buildExcludeCategoriesSelect(ctx) {
  const builder = new ChannelSelectMenuBuilder()
    .setCustomId(`${IDS.excludeCategoriesSelect}_${ctx.authorId}`)
    .setPlaceholder("Select categories.")
    .setMinValues(1)
    .setMaxValues(10)
    .setChannelTypes(ChannelType.GuildCategory);

  const defaults = existingChannels(ctx, "levelingexcludedcategories");
  if (defaults.length) builder.setDefaultChannels(defaults);
  return new ActionRowBuilder().addComponents(builder);
}

function buildExcludeCategoriesComponents(ctx) {
  return [
    buildExcludeCategoriesSelect(ctx),
    new ActionRowBuilder().addComponents(
      button(ctx, "exclusionsHome", "Go back", { emoji: "↩️" }),
      button(ctx, "excludeCategoriesReset", "Reset")
    ),
  ];
}

function buildResetOnLeaveEmbed(ctx) {
  return embed(ctx, RESET_ON_LEAVE_DESCRIPTION, { title: "Reset on Leave" }).addFields({
    name: "**Current Setup**",
    value: `* **Reset on Leave:** \`${isEnabled(ctx.getGuildVar("levelleaveonreset")) ? "Enabled" : "Disabled"}\``,
  });
}

function buildResetOnLeaveComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(
      button(ctx, "settings", "Go back", { emoji: "↩️" }),
      button(ctx, "toggleLeaveOnReset", "Toggle", { emoji: "🔄" })
    ),
  ];
}

function buildPlaceholdersEmbed(ctx) {
  return embed(ctx, PLACEHOLDERS_DESCRIPTION, { title: "Placeholders" }).addFields(
    { name: "Member-related", value: PLACEHOLDERS_MEMBER },
    { name: "Leveling-related", value: PLACEHOLDERS_LEVELING }
  );
}

function buildPlaceholdersComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(button(ctx, "settings", "Go back", { emoji: "↩️" })),
  ];
}

function buildResetConfirmEmbed(ctx) {
  return embed(
    ctx,
    "Are you sure you want to reset Leveling in this server? All members (including the ones who left the server) will lose their progress.",
    { title: "Reset Leveling?", color: "#FF0000" }
  ).setThumbnail("https://us-east-1.tixte.net/uploads/dodo-bot.wants.solutions/warning.png");
}

function buildResetConfirmComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(IDS.resetConfirm)
        .setLabel("Yes")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(IDS.resetDeny)
        .setLabel("No")
        .setStyle(ButtonStyle.Secondary)
    ),
  ];
}

function buildSetMessageModal(current) {
  const value = String(current ?? "");
  return new ModalBuilder()
    .setTitle("Set Message")
    .setCustomId(IDS.setMessageResult)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("textInput")
          .setLabel("Message to use")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder("e.g, <username> has Leveled up!")
          .setMinLength(0)
          .setMaxLength(200)
          .setValue(value.length > 200 ? value.slice(0, 200) : value)
      )
    );
}

module.exports = {
  IDS,
  isEnabled,
  formatChannel,
  permissionMessage,
  buildHomeEmbed,
  buildHomeComponents,
  buildCommandHomeComponents,
  buildSettingsEmbed,
  buildSettingsComponents,
  buildMessageEmbed,
  buildMessageComponents,
  buildChannelSetupEmbed,
  buildLevelingChannelSelect,
  buildChannelSetupComponents,
  buildExclusionsEmbed,
  buildExclusionsComponents,
  buildExcludeChannelsEmbed,
  buildExcludeChannelsSelect,
  buildExcludeChannelsComponents,
  buildExcludeCategoriesEmbed,
  buildExcludeCategoriesSelect,
  buildExcludeCategoriesComponents,
  buildResetOnLeaveEmbed,
  buildResetOnLeaveComponents,
  buildPlaceholdersEmbed,
  buildPlaceholdersComponents,
  buildResetConfirmEmbed,
  buildResetConfirmComponents,
  buildSetMessageModal,
};
