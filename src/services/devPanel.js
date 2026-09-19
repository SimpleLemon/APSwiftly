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
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const PANEL_THUMBNAIL = "https://us-east-1.tixte.net/uploads/dodo-bot.wants.solutions/devsettings.png";

const MENU_OPTIONS = [
  {
    label: "Bot Invitation Message",
    value: "botwelcome",
    description: "Whether or not the bot should greet new servers.",
    emoji: "👋",
  },
  {
    label: "Error Logging",
    value: "errorlog",
    description: "Send errors to specific channel.",
    emoji: "📢",
  },
  {
    label: "Embed color",
    value: "botembedcolor",
    description: "Change the current embed color used in all commands.",
    emoji: "🎨",
  },
  {
    label: "Pre-release",
    value: "botdevmode",
    description: "Whether or not to enable Pre-release mode.",
    emoji: "🚧",
  },
  {
    label: "Startup",
    value: "botstartup",
    description: "Choose a channel for bot's startup msgs to be sent.",
    emoji: "🚦",
  },
  {
    label: "Show build info",
    value: "showbuildinfo",
    description: 'Whether or not to enable "Build Info" in version cmd',
    emoji: "🛠️",
  },
  {
    label: "Member requirement",
    value: "memberrequirement",
    description: "How much members are required for new servers",
    emoji: "📋",
  },
];

function isOn(value) {
  return value === "on" || value === true;
}

/** Mirrors `$advancedReplaceText[$checkCondition[$getVar[x]==on];true;Enabled;false;Disabled]`. */
function setupValue(value) {
  return isOn(value) ? "Enabled" : "Disabled";
}

/** Mirrors `<#$getVar[x]> (`$getVar[x]`)` with a `none` fallback. */
function channelValue(value) {
  const id = value === undefined || value === null ? "" : String(value);
  if (!id || id === "none") return "none";
  return `<#${id}> (\`${id}\`)`;
}

function homeButton(userId) {
  return new ButtonBuilder()
    .setLabel("Home")
    .setStyle(ButtonStyle.Secondary)
    .setCustomId(`developermainpage_${userId}`)
    .setEmoji("🏠");
}

function toggleButton(userId, customId, emoji = true) {
  const button = new ButtonBuilder()
    .setLabel("Toggle")
    .setStyle(ButtonStyle.Secondary)
    .setCustomId(`${customId}_${userId}`);
  if (emoji) button.setEmoji("🔄");
  return button;
}

function channelSelect(customId) {
  return new ChannelSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder("Select a channel to use.")
    .setChannelTypes(ChannelType.GuildText)
    .setMinValues(1)
    .setMaxValues(1);
}

function mainPanelEmbed(title = "Developer Panel") {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      [
        "This panel allows you to change some things the bot operates behind the scenes.",
        "",
        "To change a option, use the select menu below to do so.",
      ].join("\n")
    )
    .setColor("Yellow")
    .setThumbnail(PANEL_THUMBNAIL);
}

function mainPanelComponents(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`devmenu_${userId}`)
        .setPlaceholder("Select a option")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          MENU_OPTIONS.map((option) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(option.label)
              .setValue(option.value)
              .setDescription(option.description)
              .setEmoji(option.emoji)
          )
        )
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Leave a server")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`leaveserverbutton_${userId}`)
    ),
  ];
}

function mainPanel(ctx, title = "Developer Panel") {
  return { embeds: [mainPanelEmbed(title)], components: mainPanelComponents(ctx.authorId) };
}

function botInvitationPage(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Bot Invitation Message")
    .setDescription(
      [
        "When APSwiftly gets added to a new server, it will greet members there with it's features including telling them it's default prefix. When this is disabled, the bot won't say anything when it gets added to new servers.",
        "",
        "By default, this is enabled to let people know the prefix easily instead of just guessing randomly to figure out.",
      ].join("\n")
    )
    .addFields({
      name: "**Current Setup**",
      value: `**Bot Invitation Message**: \`${setupValue(ctx.getVar("botinvitationmessage"))}\``,
    })
    .setColor("Yellow");

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(homeButton(ctx.authorId), toggleButton(ctx.authorId, "botgreettoggle")),
    ],
  };
}

function errorLoggingPage(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Error Logging")
    .setDescription(
      [
        "Often, you get frustrated not knowing whether or not, your bot has errors. This setting is dedicated to send errors caused by a broken command to a specific channel depending on your choice. There's also an option to enable it.",
        "",
        "When an error occurs, information such as the server name, it's id, alongside with the command name and the error will be included in logs to help the bot owners with some useful information regarding where does the error come from.",
      ].join("\n")
    )
    .addFields({
      name: "**Current Setup**",
      value: [
        `* **Error log**: \`${setupValue(ctx.getVar("errorsystem"))}\``,
        `* **Error Channel**: ${channelValue(ctx.getVar("errorchannel"))}`,
      ].join("\n"),
    })
    .setColor("Yellow");

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        homeButton(ctx.authorId),
        toggleButton(ctx.authorId, "errorlogtoggle"),
        new ButtonBuilder()
          .setLabel("Set channel")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`errorlogsetupchannel_${ctx.authorId}`)
      ),
    ],
  };
}

function errorChannelSetupPage(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Channel Setup")
    .setDescription(
      [
        "Choose a channel for Error messages to be sent in. Use the select menu below for the channel to use!",
        "",
        "**Tip:** Unable to find the channel you're looking for? Try typing the channel name instead!",
      ].join("\n")
    )
    .addFields({ name: "**Current Channel**", value: `* ${channelValue(ctx.getVar("errorchannel"))}` })
    .setColor("Yellow");

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(channelSelect(`errorlogchannelmenusetup_${ctx.authorId}`)),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Go back")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`errorlogpage_${ctx.authorId}`)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setLabel("Reset")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`errorresetchannel_${ctx.authorId}`)
      ),
    ],
  };
}

function embedColorPage(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Embed color")
    .setDescription(
      "This option allows you to change the current embed color used across commands of APSwiftly. To change the current used embed color, you will need to have a valid hex code of a color in order to proceed."
    )
    .addFields({ name: "**Current Hex code**", value: `* \`${ctx.getVar("embedcolor")}\`` })
    .setColor("Yellow");

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        homeButton(ctx.authorId),
        new ButtonBuilder()
          .setLabel("Set Color")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`setbotembedcolor_${ctx.authorId}`),
        new ButtonBuilder()
          .setLabel("Preview")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`embedcolorpreview_${ctx.authorId}`),
        new ButtonBuilder()
          .setLabel("Reset")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`resetembedcolor_${ctx.authorId}`)
      ),
    ],
  };
}

function preReleasePage(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Pre-release")
    .setDescription(
      [
        "This option allows you on whether or not the current build used should be marked as development build. By default, it is commonly enabled for development builds as expected.",
        "",
        'Disabling this will cause the build to identify itself as a "Stable" build with development build warnings being absent as well!',
      ].join("\n")
    )
    .addFields({
      name: "**Current Setup**",
      value: `**Pre-release**: \`${setupValue(ctx.getVar("pre_release"))}\``,
    })
    .setColor("Yellow");

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        homeButton(ctx.authorId),
        toggleButton(ctx.authorId, "togglebotdevmode", false)
      ),
    ],
  };
}

function startupPage(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Startup")
    .setDescription("This option let's you set a channel for the bot to inform users that it became online to use.")
    .addFields({
      name: "**Current Setup**",
      value: [
        `* **Startup**: \`${setupValue(ctx.getVar("startupchannelsystem"))}\``,
        `* **Startup channel**: ${channelValue(ctx.getVar("startupchannel"))}`,
      ].join("\n"),
    })
    .setColor("Yellow");

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        homeButton(ctx.authorId),
        toggleButton(ctx.authorId, "botstartuptoggle"),
        new ButtonBuilder()
          .setLabel("Set Channel")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`setbotstartupchannel_${ctx.authorId}`)
      ),
    ],
  };
}

function startupChannelSetupPage(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Channel Setup")
    .setDescription(
      [
        "Choose a channel for Startup messages to be sent in. Use the select menu below for the channel to use!",
        "",
        "**Tip:** Unable to find the channel you're looking for? Try typing the channel name instead!",
      ].join("\n")
    )
    .addFields({ name: "**Current Channel**", value: `* ${channelValue(ctx.getVar("startupchannel"))}` })
    .setColor("Yellow");

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(channelSelect(`botstartupchannelmenusetup_${ctx.authorId}`)),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Go back")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`startupbotpage_${ctx.authorId}`)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setLabel("Reset")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`startupresetchannel_${ctx.authorId}`)
      ),
    ],
  };
}

function showBuildInfoPage(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Show build info")
    .setDescription(
      [
        'This option allows you to either enable or disable "Build Info" page seen in `--buildinfo` flag of `version` command.',
        "",
        "When enabled, information such as branch, version codename, it's current progress, etc will be shown.",
      ].join("\n")
    )
    .addFields({
      name: "**Current Setup**",
      value: `**Show build info**: \`${setupValue(ctx.getVar("showbuildinfo"))}\``,
    })
    .setColor("Yellow");

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(homeButton(ctx.authorId), toggleButton(ctx.authorId, "showbuildinfotoggle")),
    ],
  };
}

function memberRequirementPage(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Member requirement")
    .setDescription(
      [
        "This option let's you configure how many members are needed for a server so that the bot can join there.",
        "",
        "When the requirement is not met, the bot will simply leave the server.",
      ].join("\n")
    )
    .addFields({ name: "**Current requirement**", value: `* \`${ctx.getVar("servermemberrequirement")}\`` })
    .setColor("Yellow");

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        homeButton(ctx.authorId),
        new ButtonBuilder()
          .setLabel("Set requirement")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`setmemberrequirement_${ctx.authorId}`),
        new ButtonBuilder()
          .setLabel("Reset")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`resetmemberrequirement_${ctx.authorId}`)
      ),
    ],
  };
}

/** Mirrors `{textInput:Hex code:1:hexInput:true:e.g, <original>:0:7:<current>}`. */
function embedColorModal(ctx) {
  const input = new TextInputBuilder()
    .setCustomId("hexInput")
    .setLabel("Hex code")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder(`e.g, ${ctx.getVar("originalembedcolor")}`)
    .setMinLength(0)
    .setMaxLength(7);

  const current = String(ctx.getVar("embedcolor") ?? "");
  if (current.length >= 1 && current.length <= 7) input.setValue(current);

  return new ModalBuilder()
    .setCustomId("embedcolorsetresult")
    .setTitle("Set Color")
    .addComponents(new ActionRowBuilder().addComponents(input));
}

/** Mirrors `{textInput:Number to require:1:numberInput:true:e.g, 50:0:100:<current>}`. */
function memberRequirementModal(ctx) {
  const input = new TextInputBuilder()
    .setCustomId("numberInput")
    .setLabel("Number to require")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("e.g, 50")
    .setMinLength(0)
    .setMaxLength(100);

  const current = String(ctx.getVar("servermemberrequirement") ?? "");
  if (current.length >= 1 && current.length <= 100) input.setValue(current);

  return new ModalBuilder()
    .setCustomId("memberrequirementsetresult")
    .setTitle("Set requirement")
    .addComponents(new ActionRowBuilder().addComponents(input));
}

/** Mirrors `{textInput:Server ID:1:numberInput:true:e.g, <random guild>:0:160}`. */
function leaveServerModal(ctx) {
  const input = new TextInputBuilder()
    .setCustomId("numberInput")
    .setLabel("Server ID")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(0)
    .setMaxLength(160);

  const randomGuildId = ctx.client.guilds.cache.random()?.id;
  if (randomGuildId) input.setPlaceholder(`e.g, ${randomGuildId}`);

  return new ModalBuilder()
    .setCustomId("leaveservermodalresult")
    .setTitle("Leave a server")
    .addComponents(new ActionRowBuilder().addComponents(input));
}

module.exports = {
  PANEL_THUMBNAIL,
  MENU_OPTIONS,
  isOn,
  setupValue,
  channelValue,
  mainPanelEmbed,
  mainPanelComponents,
  mainPanel,
  botInvitationPage,
  errorLoggingPage,
  errorChannelSetupPage,
  embedColorPage,
  preReleasePage,
  startupPage,
  startupChannelSetupPage,
  showBuildInfoPage,
  memberRequirementPage,
  embedColorModal,
  memberRequirementModal,
  leaveServerModal,
};
