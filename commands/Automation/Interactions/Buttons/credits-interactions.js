"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const CREDIT_PAGES = [
  { label: "Main Credits", id: "maincredits" },
  { label: "Packages used", id: "packagesused" },
  { label: "Use of source code", id: "useofsource" },
];

function creditRow(userId, active) {
  return new ActionRowBuilder().addComponents(
    ...CREDIT_PAGES.map((page) =>
      new ButtonBuilder()
        .setLabel(page.label)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`${page.id}_${userId}`)
        .setDisabled(page.id === active)
    )
  );
}

function packagesEmbed(ctx) {
  return new EmbedBuilder()
    .setTitle("Packages used")
    .setDescription(
      "Some stuff in Dodo-Bot were made possible using certain packages. This page aims to credit all of the packages to respect their owners."
    )
    .addFields({
      name: "Packages",
      value: [
        "* **aoi.js** - The original Dodo-Bot runtime; APSwiftly now uses discord.js and SQLite.",
        "* **@aoijs/aoi.db** - Database used in the bot",
        "* **discord-gamecord** - Mostly used in game commands such as `minesweeper`, `snake`, etc.",
        "* **chalk** - For colored texts on console especially the bot's custom message",
        "* **dotenv** - Adds support for environment variables in local hosting",
      ].join("\n"),
    })
    .setColor(ctx.getVar("embedcolor"));
}

async function username(client, id) {
  const user = client.users.cache.get(id) ?? (await client.users.fetch(id).catch(() => null));
  return user?.username ?? "Unknown User";
}

async function mainCreditsEmbed(ctx) {
  const ids = ["632607624742961153", "431749535656837130", "738856854892839022", "769525910164471821"];
  const names = await Promise.all(ids.map((id) => username(ctx.client, id)));

  return new EmbedBuilder()
    .setTitle("Dodo-Bot Credits")
    .setDescription(
      [
        `* ${names[0]} - Developer of the bot`,
        `* ${names[1]} - Inspiration to improve some commands`,
        `* ${names[2]} - For Leveling setup`,
        `* ${names[3]} - For \`guess-the-pokemon\` code (and some ideas as well)`,
        "* aoi.js server - For a lot of help",
        "* [discordicon.com](https://discordicon.com/icons-editor) - For most of the icons used in commands",
      ].join("\n")
    )
    .setColor(ctx.getVar("embedcolor"));
}

function useOfSourceEmbed(ctx) {
  return new EmbedBuilder()
    .setTitle("Use of source code")
    .setDescription(
      [
        "When using the source code for development purposes, it is recommended to give credits to the original work done on the bot itself, which can be done by including the username `dodogames` in your project.",
        "",
        "**For public bots**",
        "It is not recommended to claim that you fully made the bot yourself and even advertise it to the public. It is fine if you used the source code but then made it slightly different that doesn't result in being too smiliar to the original bot.",
        "",
        "A modified instance of Dodo-Bot should be normally allowed as long as the credit for the original work is included (or when permission is given to do so).",
        "",
        "**For private bots**",
        "The rule of using the source code is not strict in this case. If it's used to try the bot then you do not need to do anything. You may give credit if the said private bot was designed for a server in case of modifying it.",
      ].join("\n")
    )
    .setColor(ctx.getVar("embedcolor"));
}

module.exports = [
  {
    component: "button",
    customId: "packagesused",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }
      await ctx.update({ embeds: [packagesEmbed(ctx)], components: [creditRow(ctx.authorId, "packagesused")] });
    },
  },
  {
    component: "button",
    customId: "maincredits",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }
      await ctx.update({ embeds: [await mainCreditsEmbed(ctx)], components: [creditRow(ctx.authorId, "maincredits")] });
    },
  },
  {
    component: "button",
    customId: "useofsource",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }
      await ctx.update({ embeds: [useOfSourceEmbed(ctx)], components: [creditRow(ctx.authorId, "useofsource")] });
    },
  },
];
