"use strict";

const { EmbedBuilder } = require("discord.js");
const { resolveLogChannel } = require("../../../../src/services/logging");

/** Port of the console/channel startup messages and pre-release warning. */
module.exports = [
  {
    event: "ready",
    once: true,
    async execute(ctx) {
      const { client } = ctx;
      client.logger.log(`Client ${client.user.tag} is ready and running!`);
      const invite = await client.generateInvite({
        scopes: ["bot", "applications.commands"],
        permissions: ["SendMessages", "ViewChannel", "AddReactions", "AttachFiles", "ViewAuditLog"],
      });
      client.logger.log(`Invite your bot using this link: ${invite}`);

      if (String(client.db.getVar("pre_release")) === "on") {
        client.logger.warn(
          "Development build has been detected!\nUsing Development builds are not recommended for public usage as they may contain bugs and as such, it is advised to try them for testing purposes only!"
        );
      }

      if (client.db.getVar("startupchannelsystem") !== "on") return;
      const guilds = [...client.guilds.cache.values()];
      for (const guild of guilds) {
        const channel = await resolveLogChannel(client, guild, "startupchannel");
        if (!channel) continue;
        const embed = new EmbedBuilder()
          .setTitle("Ready!")
          .setDescription(`${client.user.username} is now running!`)
          .setColor("DarkGreen");
        await channel.send({ embeds: [embed] }).catch(() => {});
      }
    },
  },
];
