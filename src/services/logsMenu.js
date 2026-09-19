"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

const IDS = {
  home: "setuplogshome",
  menu: "setuplogsmenu",
  msgChannelSelect: "msgeventchannelsetupmenu",
  msgReset: "msgeventresetchannel",
  msgModules: "msgeventsetupmenu",
  memberChannelSelect: "membereventchannelsetupmenu",
  memberReset: "membereventresetchannel",
  memberModules: "membereventsetupmenu",
  serverChannelSelect: "servereventchannelsetupmenu",
  serverReset: "servereventresetchannel",
  serverModules: "servereventsetupmenu",
};

const LEFT_ARROW = "<:left_arrow:1374180400489828362>";
const BOX = "<:box:1374183092092403782>";
const BOX_TICK = "<:box_tick:1374183078158925844>";

const CHANNEL_VARS = {
  msg: "msgeventschannel",
  member: "membereventschannel",
  server: "servereventschannel",
};

const MODULE_TOGGLES = {
  msg: { "1": "msgdeletelog", "2": "msgeditlog" },
  member: {
    "1": "roleuserslog",
    "2": "nameupdatelog",
    "3": "nicknameupdatelog",
    "4": "banneduserslog",
    "5": "unbanneduserslog",
  },
  server: { "1": "Integrationlog" },
};

function isOn(value) {
  return value === "on" || value === true;
}

function embed(ctx, description, { title } = {}) {
  const builder = new EmbedBuilder().setColor(ctx.getVar("embedcolor") ?? "#2A3759");
  if (title) builder.setTitle(title);
  if (description) builder.setDescription(description);
  return builder;
}

function check(value) {
  return isOn(value) ? BOX_TICK : BOX;
}

function channelText(value, { backticks = false } = {}) {
  if (!value || value === "none") return backticks ? "`No channel selected`" : "No channel selected";
  return `<#${value}>`;
}

function guildAuthor(embed, ctx) {
  return embed.setAuthor({
    name: ctx.guild?.name ?? "Unknown Server",
    iconURL: ctx.guild?.iconURL?.() ?? undefined,
  });
}

function buildLoggingEmbed(ctx, title = "Logging Menu") {
  const description = [
    "**Channel Selection:**",
    `Message Events: ${channelText(ctx.getGuildVar(CHANNEL_VARS.msg), { backticks: true })}`,
    `Server Events: ${channelText(ctx.getGuildVar(CHANNEL_VARS.server), { backticks: true })}`,
    `Member Events: ${channelText(ctx.getGuildVar(CHANNEL_VARS.member), { backticks: true })}`,
    "Voice Events: `Soon!`",
    "",
    "**Settings:**",
    `Include Bots in Message Logs: \`${isOn(ctx.getGuildVar("includebots")) ? "True" : "False"}\``,
    "",
    "Edit server logging using the dropdown menu below!",
  ].join("\n");

  return embed(ctx, description, { title });
}

function buildLoggingMenuSelect(ctx) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`${IDS.menu}_${ctx.authorId}`)
      .setPlaceholder("⚙️ Configure server logging")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: "Message Events",
          value: "msgeventlogs",
          description: "Configure message logs",
        },
        {
          label: "Server Events",
          value: "servereventlogs",
          description: "Configure server edit logs",
        },
        {
          label: "Member Events",
          value: "membereventlogs",
          description: "Configure member logs",
        },
      ])
  );
}

function buildLoggingComponents(ctx) {
  return [buildLoggingMenuSelect(ctx)];
}

function resetButton(ctx, key) {
  return new ButtonBuilder()
    .setCustomId(`${IDS[key]}_${ctx.authorId}`)
    .setLabel("Reset")
    .setStyle(ButtonStyle.Secondary);
}

function menuButton(ctx) {
  return new ButtonBuilder()
    .setCustomId(`${IDS.home}_${ctx.authorId}`)
    .setLabel("Menu")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(LEFT_ARROW);
}

function buildMessageEventsEmbed(ctx) {
  const description = [
    "**Channel:**",
    channelText(ctx.getGuildVar(CHANNEL_VARS.msg)),
    `> ${check(ctx.getGuildVar("msgdeletelog"))} Deleted Messages`,
    `> ${check(ctx.getGuildVar("msgeditlog"))} Edited Messages`,
  ].join("\n");

  return guildAuthor(embed(ctx, description, { title: "Message Events" }), ctx);
}

function buildMessageEventsComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(menuButton(ctx), resetButton(ctx, "msgReset")),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`${IDS.msgChannelSelect}_${ctx.authorId}`)
        .setPlaceholder("Select a channel to use (Tip∶ try typing)")
        .setMinValues(1)
        .setMaxValues(1)
        .setChannelTypes(ChannelType.GuildText)
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`${IDS.msgModules}_${ctx.authorId}`)
        .setPlaceholder("Modify logging modules")
        .setMinValues(1)
        .setMaxValues(2)
        .addOptions([
          {
            label: "Deleted Messages",
            value: "1",
            description: "Toggle logging for deleted messages",
          },
          {
            label: "Edited Messages",
            value: "2",
            description: "Toggle logging for edited messages",
          },
        ])
    ),
  ];
}

function buildMemberEventsEmbed(ctx) {
  const description = [
    "**Channel:**",
    channelText(ctx.getGuildVar(CHANNEL_VARS.member), { backticks: true }),
    `> ${check(ctx.getGuildVar("roleuserslog"))} Role Updates`,
    `> ${check(ctx.getGuildVar("nameupdatelog"))} Name Updates`,
    `> ${check(ctx.getGuildVar("nicknameupdatelog"))} Nickname Updates`,
    `> ${check(ctx.getGuildVar("banneduserslog"))} Member Bans`,
    `> ${check(ctx.getGuildVar("unbanneduserslog"))} Member Unbans`,
  ].join("\n");

  return guildAuthor(embed(ctx, description, { title: "Member Events" }), ctx);
}

function buildMemberEventsComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(menuButton(ctx), resetButton(ctx, "memberReset")),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`${IDS.memberChannelSelect}_${ctx.authorId}`)
        .setPlaceholder("Select a channel to use (Tip∶ try typing)")
        .setMinValues(1)
        .setMaxValues(1)
        .setChannelTypes(ChannelType.GuildText)
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`${IDS.memberModules}_${ctx.authorId}`)
        .setPlaceholder("Modify logging modules")
        .setMinValues(1)
        .setMaxValues(5)
        .addOptions([
          {
            label: "Role Updates",
            value: "1",
            description: "Toggle logging for role updates",
          },
          {
            label: "Name Updates",
            value: "2",
            description: "Toggle logging for name updates",
          },
          {
            label: "Nickname Updates",
            value: "3",
            description: "Toggle logging for nickname updates",
          },
          {
            label: "Member Bans",
            value: "4",
            description: "Toggle logging for member bans",
          },
          {
            label: "Member Unbans",
            value: "5",
            description: "Toggle logging for member unbans",
          },
        ])
    ),
  ];
}

function buildServerEventsEmbed(ctx) {
  const description = [
    "**Channel:**",
    channelText(ctx.getGuildVar(CHANNEL_VARS.server), { backticks: true }),
    `> ${check(ctx.getGuildVar("Integrationlog"))} Integration Updates`,
  ].join("\n");

  return guildAuthor(embed(ctx, description, { title: "Server Events" }), ctx);
}

function buildServerEventsComponents(ctx) {
  return [
    new ActionRowBuilder().addComponents(menuButton(ctx), resetButton(ctx, "serverReset")),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`${IDS.serverChannelSelect}_${ctx.authorId}`)
        .setPlaceholder("Select a channel to use (Tip∶ try typing)")
        .setMinValues(1)
        .setMaxValues(1)
        .setChannelTypes(ChannelType.GuildText)
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`${IDS.serverModules}_${ctx.authorId}`)
        .setPlaceholder("Modify logging modules")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions([
          {
            label: "Integration Updates",
            value: "1",
            description: "Toggle logging for integration updates",
          },
        ])
    ),
  ];
}

function toggleModules(ctx, kind) {
  const mapping = MODULE_TOGGLES[kind];
  for (const [value, variable] of Object.entries(mapping)) {
    if (!ctx.values.includes(value)) continue;
    ctx.setGuildVar(variable, isOn(ctx.getGuildVar(variable)) ? "off" : "on");
  }
}

function permissionMessage(channelId) {
  return [
    `I do not have permissions there. Please ensure that I have the following permissions in <#${channelId}>:`,
    "`ViewChannel`",
    "`SendMessages`",
  ].join("\n");
}

module.exports = {
  IDS,
  CHANNEL_VARS,
  MODULE_TOGGLES,
  isOn,
  channelText,
  buildLoggingEmbed,
  buildLoggingMenuSelect,
  buildLoggingComponents,
  buildMessageEventsEmbed,
  buildMessageEventsComponents,
  buildMemberEventsEmbed,
  buildMemberEventsComponents,
  buildServerEventsEmbed,
  buildServerEventsComponents,
  toggleModules,
  permissionMessage,
};
