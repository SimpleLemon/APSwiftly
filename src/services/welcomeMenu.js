"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");

const WELCOMER_MEMBER_PLACEHOLDERS = [
  "`<username>` - Returns the member's username",
  "`<mention>` - Pings the new member",
  "`<Displayname>` - Returns the member's displayname",
  "`<id>` - Returns the new member's id",
  "`<creationdate>` - Returns the date when the member joined Discord",
  "`<position>` - Returns the join position of the member",
].join("\n");

const LEAVE_MEMBER_PLACEHOLDERS = [
  "`<username>` - Returns the member's username",
  "`<mention>` - Pings the member",
  "`<Displayname>` - Returns the member's displayname",
  "`<id>` - Returns the member's id",
  "`<creationdate>` - Returns the date when the member joined Discord",
  "`<position>` - Returns the join position of the member",
].join("\n");

const SERVER_PLACEHOLDERS = [
  "`<owner.username>` - Returns the username of the server owner",
  "`<owner.id>` - Returns the id of the server owner",
  "`<server.name>` - Returns the server name",
  "`<server.totalMembers>` - Returns the amount of members in the server",
  "`<server.id>` - Returns the server id",
].join("\n");

const LEAVE_PLACEHOLDERS = "`<leave.time>` - Displays the time when the user left the server";

const MENUS = {
  welcomer: {
    title: "Welcomer",
    settingsTitle: "Welcomer Settings",
    settingsDescription: "Welcome to Welcomer settings! Select a option to change.",
    homeDescription: [
      "Welcomer is an way to greet new members of your server with your own choice of the message you're going to use it for the server!",
      "",
      'To get started, click on the "Toggle" button! To manage the settings regarding the said feature, press the "Settings" button.',
    ].join("\n"),
    channelDescription: [
      "Choose a channel for Welcomer messages to be sent in. Use the select menu below for the channel to use!",
      "",
      "**Tip:** Unable to find the channel you're looking for? Try typing the channel name instead!",
    ].join("\n"),
    messageDescription: "Welcome to options under the `Message` category! Select any option to modify!",
    messageTypeDescription: [
      "There're two types:",
      "",
      "* **Text**",
      "* **Embed**",
      "",
      "`Text` is the default type used for Welcomer messages. `Embed` will use embeds for the messages.",
      "",
      "-# If the message contains over 2000 characters, `Embed` will be used to avoid problems.",
    ].join("\n"),
    placeholdersDescription:
      "Placeholders allows you to make your custom Welcomer message unique. Use the current ones available in this list!",
    placeholdersMember: WELCOMER_MEMBER_PLACEHOLDERS,
    placeholdersExtras: null,
    messagePlaceholder: "e.g, Welcome <username>",
    systemVar: "welcomesystem",
    channelVar: "welcomechannel",
    messageVar: "welcomemessage",
    typeVar: "welcometype",
    embedColorVar: "welcomemessageembedcolor",
    toggleOn: "Successfully enabled Welcomer!",
    toggleOff: "Successfully disabled Welcomer!",
    typeEmbed: "Welcomer message will now be in embeds!",
    typeText: "Welcomer message will now be in `Text` mode!",
    setMessageReply: "Successfully set the Welcomer message!",
    testReply: "Successfully sent the message to the Welcomer channel for testing!",
    testMissing: "There is no channel set to test the Welcomer message.\nPlease set a new channel first.",
    testDeleted:
      "The channel used for the Welcomer channel seems to be deleted.\nCancelled sending the message as a result. Please set a new channel to fix this.",
    channelMissing:
      "The channel you chose no longer exists in this server.\nPlease set a valid channel which exists inside this server.",
    channelUsed: "This channel is already used for Welcomer messages. Please, set a different channel instead.",
    channelSet: (channelId) => `<#${channelId}> will now be used for Welcomer messages!`,
    ids: {
      home: "welcomerhomebutton",
      toggle: "togglewel",
      settings: "welsettings",
      channel: "welcomerchannelbutton",
      channelSelect: "welcomerchannelmenusetup",
      resetChannel: "welcomerresetchannel",
      message: "welcomermessagebutton",
      setMessage: "welcomersetmsgbutton",
      messageType: "welcomermessagetypebutton",
      toggleMessageType: "togglewelcomermessagetype",
      testMessage: "welcomertestmessagebutton",
      placeholders: "welcomerplaceholders",
      textModal: "welcomertextmodal",
      embedModal: "welcomerembedmodal",
    },
  },
  leave: {
    title: "Leave",
    settingsTitle: "Leave Settings",
    settingsDescription: "Welcome to Leave settings! Select a option to change.",
    homeDescription: [
      "Leave just like Welcomer is a way to setup an channel where the bot says goodbye to members leaving your server!",
      "",
      'To get started, click on the "Toggle" button! To manage the settings regarding the said feature, press the "Settings" button.',
    ].join("\n"),
    channelDescription: [
      "Choose a channel for Leave messages to be sent in. Use the select menu below for the channel to use!",
      "",
      "**Tip:** Unable to find the channel you're looking for? Try typing the channel name instead!",
    ].join("\n"),
    messageDescription: "Welcome to options under the `Message` category! Select any option to modify!",
    messageTypeDescription: [
      "there're two types:",
      "",
      "* **Text**",
      "* **Embed**",
      "",
      "`Text` is the default type used for Leave messages. `Embed` will use embeds for the messages.",
      "",
      "-# If the message contains over 2000 characters, `Embed` will be used to avoid problems.",
    ].join("\n"),
    placeholdersDescription:
      "Placeholders allows you to make your custom Leave message unique. Use the current ones available in this list!",
    placeholdersMember: LEAVE_MEMBER_PLACEHOLDERS,
    placeholdersExtras: LEAVE_PLACEHOLDERS,
    messagePlaceholder: "e.g, Goodbye <username>!",
    systemVar: "leavesystem",
    channelVar: "leavechannel",
    messageVar: "leavemessage",
    typeVar: "leavetype",
    embedColorVar: "leavemessageembedcolor",
    toggleOn: "Successfully enabled Leave!",
    toggleOff: "Successfully disabled Leave!",
    typeEmbed: "Leave message will now be in embeds!",
    typeText: "Leave message will now be in `Text` mode!",
    setMessageReply: "Successfully set the Leave message!",
    testReply: "Successfully sent the message to the Leave channel for testing!",
    testMissing: "There is no channel set to test the Leave message.\nPlease set a new channel first.",
    testDeleted:
      "The channel used for the Leave channel seems to be deleted.\nCancelled sending the message as a result. Please set a new channel to fix this.",
    channelMissing:
      "The channel you chose no longer exists in this server.\nPlease set a valid channel which exists inside this server.",
    channelUsed: "This channel is already used for Leave messages. Please, set a different channel instead.",
    channelSet: (channelId) => `<#${channelId}> will now be used for Leave messages!`,
    ids: {
      home: "leavehomebutton",
      toggle: "toggleleave",
      settings: "leavesettings",
      channel: "leavechannelbutton",
      channelSelect: "leavechannelmenusetup",
      resetChannel: "leaveresetchannel",
      message: "leavemessagebutton",
      setMessage: "leavesetmsgbutton",
      messageType: "leavemessagetypebutton",
      toggleMessageType: "toggleleavemessagetype",
      testMessage: "leavetestmessagebutton",
      placeholders: "leaveplaceholders",
      textModal: "leavetextmodal",
      embedModal: "leaveembedmodal",
    },
  },
};

function isEnabled(value) {
  return value === "on" || value === true;
}

function toUpper(value) {
  return String(value ?? "").toLocaleUpperCase();
}

function formatChannel(channelId) {
  if (!channelId || channelId === "none") return "none";
  return `<#${channelId}> (\`${channelId}\`)`;
}

function permissionMessage(channelId) {
  return [
    `Hmm. Seems like i don't have the right permissions there. Please ensure that i have the following permissions for the channel <#${channelId}>:`,
    "`ViewChannel`",
    "`SendMessages`",
  ].join("\n");
}

function validateHex(value) {
  const hex = String(value ?? "");
  if (!hex.startsWith("#")) {
    return "Your hex code must start with a `#`! Please, try again.";
  }
  if (Number.isNaN(parseInt(hex.replace("#", ""), 16))) {
    return "You did not provide a hex code! Please, make sure to provide a actual hex code and try again.";
  }
  if (!/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hex)) {
    return "Your hex code containing the color is incorrect! Please, double check your hex code and try again.";
  }
  return null;
}

function embed(ctx, title, description, fields = []) {
  const builder = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(ctx.getVar("embedcolor") ?? "#2A3759");
  if (fields.length) builder.addFields(fields);
  return builder;
}

function button(ctx, kind, key, label, { style = ButtonStyle.Secondary, emoji } = {}) {
  const menu = MENUS[kind];
  const builder = new ButtonBuilder()
    .setCustomId(`${menu.ids[key]}_${ctx.authorId}`)
    .setLabel(label)
    .setStyle(style);
  if (emoji) builder.setEmoji(emoji);
  return builder;
}

function buildHomeEmbed(ctx, kind) {
  const menu = MENUS[kind];
  const status = isEnabled(ctx.getGuildVar(menu.systemVar)) ? "Enabled" : "Disabled";
  return embed(ctx, menu.title, `${menu.homeDescription}\n\n**Current Setup**\n* ${status}`);
}

function buildHomeComponents(ctx, kind) {
  return [
    new ActionRowBuilder().addComponents(
      button(ctx, kind, "toggle", "Toggle", { emoji: "🔄" }),
      button(ctx, kind, "settings", "Settings", { style: ButtonStyle.Danger })
    ),
  ];
}

function buildSettingsEmbed(ctx, kind) {
  const menu = MENUS[kind];
  const channel = formatChannel(ctx.getGuildVar(menu.channelVar));
  const type = toUpper(ctx.getGuildVar(menu.typeVar));
  return embed(ctx, menu.settingsTitle, menu.settingsDescription, [
    {
      name: "**Current Setup**",
      value: `* **Channel:** ${channel}\n* **Message Type:** \`${type}\``,
    },
  ]);
}

function buildSettingsComponents(ctx, kind) {
  return [
    new ActionRowBuilder().addComponents(
      button(ctx, kind, "home", "Home", { emoji: "🏠" }),
      button(ctx, kind, "channel", "Channel"),
      button(ctx, kind, "message", "Message"),
      button(ctx, kind, "placeholders", "Placeholders")
    ),
  ];
}

function buildChannelSetupEmbed(ctx, kind) {
  const menu = MENUS[kind];
  return embed(ctx, "Channel Setup", menu.channelDescription, [
    {
      name: "**Current Channel**",
      value: `* ${formatChannel(ctx.getGuildVar(menu.channelVar))}`,
    },
  ]);
}

function buildChannelSelect(ctx, kind) {
  const menu = MENUS[kind];
  return new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`${menu.ids.channelSelect}_${ctx.authorId}`)
      .setPlaceholder("Select a channel to use.")
      .setMinValues(1)
      .setMaxValues(1)
      .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
  );
}

function buildChannelSetupComponents(ctx, kind) {
  return [
    buildChannelSelect(ctx, kind),
    new ActionRowBuilder().addComponents(
      button(ctx, kind, "settings", "Go back", { emoji: "↩️" }),
      button(ctx, kind, "resetChannel", "Reset")
    ),
  ];
}

function buildMessageEmbed(ctx, kind) {
  const menu = MENUS[kind];
  return embed(ctx, "Message", menu.messageDescription);
}

function buildMessageComponents(ctx, kind) {
  return [
    new ActionRowBuilder().addComponents(
      button(ctx, kind, "settings", "Go back", { emoji: "↩️" }),
      button(ctx, kind, "setMessage", "Set Message"),
      button(ctx, kind, "testMessage", "Test Message"),
      button(ctx, kind, "messageType", "Type")
    ),
  ];
}

function buildMessageTypeEmbed(ctx, kind) {
  const menu = MENUS[kind];
  const type = toUpper(ctx.getGuildVar(menu.typeVar));
  return embed(ctx, "Message type", menu.messageTypeDescription, [
    {
      name: "**Current type**",
      value: `* \`${type}\``,
    },
  ]);
}

function buildMessageTypeComponents(ctx, kind) {
  return [
    new ActionRowBuilder().addComponents(
      button(ctx, kind, "message", "Go back", { emoji: "↩️" }),
      button(ctx, kind, "toggleMessageType", "Toggle", { emoji: "🔄" })
    ),
  ];
}

function buildPlaceholdersEmbed(ctx, kind) {
  const menu = MENUS[kind];
  const fields = [
    { name: "Member-related", value: menu.placeholdersMember },
    { name: "Server-related", value: SERVER_PLACEHOLDERS },
  ];
  if (menu.placeholdersExtras) fields.push({ name: "Extras", value: menu.placeholdersExtras });
  return embed(ctx, "Placeholders", menu.placeholdersDescription, fields);
}

function buildPlaceholdersComponents(ctx, kind) {
  return [
    new ActionRowBuilder().addComponents(button(ctx, kind, "settings", "Go back", { emoji: "↩️" })),
  ];
}

module.exports = {
  MENUS,
  isEnabled,
  toUpper,
  formatChannel,
  permissionMessage,
  validateHex,
  buildHomeEmbed,
  buildHomeComponents,
  buildSettingsEmbed,
  buildSettingsComponents,
  buildChannelSetupEmbed,
  buildChannelSelect,
  buildChannelSetupComponents,
  buildMessageEmbed,
  buildMessageComponents,
  buildMessageTypeEmbed,
  buildMessageTypeComponents,
  buildPlaceholdersEmbed,
  buildPlaceholdersComponents,
};
