"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const DEVBUILD_FOOTER = {
  text: "Testing is recommended",
  iconURL: "https://us-east-1.tixte.net/uploads/dodogames.wants.solutions/refreshedredwarning2.png",
};

const VERSION_PAGES = [
  { label: "Home", id: "homebutton", emoji: "🏠" },
  { label: "Changes", id: "versionchanges" },
  { label: "Bug Fixes", id: "versionbugfixes" },
  { label: "Other", id: "versionother" },
];

const CHANGES_DESCRIPTION = "Native discord.js commands, SQLite storage, durable check-ins, inactivity automation, and permission-aware help.";
const BUG_FIXES_DESCRIPTION = "Check-in delivery is protected against repeated clicks and restart replay. Slash registration, settings, logging, and interaction handling have been repaired.";

function pageRow(userId, active) {
  const components = VERSION_PAGES.filter((page) => !(active === "homebutton" && page.id === "homebutton")).map(
    (page) => {
      const button = new ButtonBuilder()
        .setLabel(page.label)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`${page.id}_${userId}`)
        .setDisabled(page.id === active);
      if (page.emoji) button.setEmoji(page.emoji);
      return button;
    }
  );

  return new ActionRowBuilder().addComponents(...components);
}

function changelogRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Changelog history")
      .setStyle(ButtonStyle.Link)
      .setURL("https://github.com/SimpleLemon/APSwiftly/releases")
      .setEmoji("📜")
  );
}

function pageEmbed(ctx, title, description) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(ctx.getVar("embedcolor"));
  if (ctx.getVar("pre_release") === "on") embed.setFooter(DEVBUILD_FOOTER);
  return embed;
}

function otherDescription() {
  return "APSwiftly is based on Dodo-Bot. Upstream attribution is retained in the credits. Deployment and database migration are separate operational steps.";
}
function homeDescription() {
  return `**APSwiftly ${require("../../../../package.json").version}**\nRuntime: discord.js + SQLite`;
}

module.exports = [
  {
    component: "button",
    customId: "versionchanges",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }
      await ctx.update({
        embeds: [pageEmbed(ctx, "Changes", CHANGES_DESCRIPTION)],
        components: [pageRow(ctx.authorId, "versionchanges"), changelogRow()],
      });
    },
  },
  {
    component: "button",
    customId: "versionbugfixes",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }
      await ctx.update({
        embeds: [pageEmbed(ctx, "Bug Fixes", BUG_FIXES_DESCRIPTION)],
        components: [pageRow(ctx.authorId, "versionbugfixes"), changelogRow()],
      });
    },
  },
  {
    component: "button",
    customId: "versionother",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }
      await ctx.update({
        embeds: [pageEmbed(ctx, "Other", otherDescription(ctx))],
        components: [pageRow(ctx.authorId, "versionother"), changelogRow()],
      });
    },
  },
  {
    component: "button",
    customId: "homebutton",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }
      await ctx.update({
        embeds: [pageEmbed(ctx, "APSwiftly version", homeDescription(ctx))],
        components: [pageRow(ctx.authorId, "homebutton"), changelogRow()],
      });
    },
  },
];
