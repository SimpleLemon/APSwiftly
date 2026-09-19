"use strict";

const { EmbedBuilder } = require("discord.js");
const { cpuUsage, ramUsage, uptimeString, cpuModel, platform, discordVersion } = require("../../src/utils/system");

module.exports = {
  name: "stats",
  aliases: ["botstats", "info"],
  info: {
    description: "Returns statistics about the bot.",
    perms: "`SendMessages`",
  },
  async execute(ctx) {
    const { client } = ctx;
    const ownerId = client.ownerIds[0];
    const owner = ownerId ? await client.users.fetch(ownerId).catch(() => null) : null;
    const totalMembers = client.guilds.cache.reduce((sum, guild) => sum + (guild.memberCount ?? 0), 0);

    const embed = new EmbedBuilder()
      .setTitle("Bot Statistics/Information")
      .setAuthor({
        name: client.user.username,
        iconURL: client.user.displayAvatarURL({ extension: "png", size: 512 }),
      })
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/795966035919634455/807884403904741386/5495053-statistic-icons-download-5953-free-png-and-vector-icons-statistic-png-512_512_preview.png"
      )
      .setColor("Random")
      .addFields(
        {
          name: "Others",
          value: [
            `• Total commands: ${client.registry.prefixCommands.size}`,
            `• Latency: ${client.ws.ping} ms`,
            `• Uptime: ${uptimeString(client.uptime ?? 0)}`,
            `• Owner: ${owner ? owner.tag : "Unknown"}`,
          ].join("\n"),
        },
        {
          name: "Versions",
          value: [`• NodeJS Version: ${process.version}`, `• Discord.js Version: ${discordVersion}`].join("\n"),
        },
        {
          name: "Hosting Related Stats",
          value: [
            `• CPU Usage: ${cpuUsage()}`,
            `• CPU Model: ${cpuModel()}`,
            `• CPU Platform: ${platform()}`,
            `• RAM Usage: ${ramUsage("heapUsed")} MB`,
            `• Memory Usage: ${ramUsage("rss")} MB`,
          ].join("\n"),
        },
        {
          name: "Bot Information",
          value: [
            `Name: ${client.user.username}`,
            `Tag: #0`,
            `ID: ${client.user.id}`,
            `Total servers: ${client.guilds.cache.size}`,
            `Total users: ${totalMembers}`,
          ].join("\n"),
        }
      );

    await ctx.send({ embeds: [embed] });
  },
};
