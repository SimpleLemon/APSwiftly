"use strict";

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { resolveLogChannel } = require("../../../src/services/logging");

const SOURCE_CODE_URL = "https://github.com/SimpleLemon/APSwiftly";
const DODO_LOGO = "https://us-east-1.tixte.net/uploads/dodogames.wants.solutions/dodo-bot-logo.png";

module.exports = [
  {
    event: "guildJoin",
    async execute(ctx) {
      const { client, guild } = ctx;
      if (!guild) return;

      const requirement = Number(client.db.getVar("servermemberrequirement")) || 0;
      if (guild.memberCount < requirement) {
        await guild.leave().catch(() => {});
        return;
      }

      if (client.db.getVar("botinvitationmessage") !== "on") return;

      const configured = client.db.getGuildVar(guild.id, "welcomechannel");
      const channel =
        configured && configured !== "none"
          ? await resolveLogChannel(client, guild, "welcomechannel")
          : guild.systemChannel ??
            guild.channels.cache.find(
              (candidate) =>
                candidate.isTextBased() &&
                candidate.permissionsFor(guild.members.me)?.has(["ViewChannel", "SendMessages"])
            );

      if (!channel) return;

      const prefix = client.db.getGuildVar(guild.id, "prefix");
      const embed = new EmbedBuilder()
        .setTitle("Welcome to APSwiftly!")
        .setDescription(
          "APSwiftly is APStudy’s community bot, built with discord.js and SQLite."
        )
        .addFields(
          {
            name: "Confused?",
            value: `If you need information about commands in the bot then use the command \`${prefix}commandinfo <cmdname>\` to do so!`,
          },
          {
            name: "Getting started",
            value: `To explore the bot, use the command \`${prefix}help\`. This let's you view all of the commands of the bot in a selectmenu as modules!`,
          }
        )
        .setThumbnail(DODO_LOGO)
        .setFooter({ text: "Made with ❤️ by dodoGames!" })
        .setColor(client.db.getVar("embedcolor"));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Source code").setStyle(ButtonStyle.Link).setURL(SOURCE_CODE_URL)
      );

      await channel.send({ embeds: [embed], components: [row] });
    },
  },
];
