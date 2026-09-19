"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { reloadCommands } = require("../../src/services/reload");

module.exports = {
  slash: { name: "reload" },
  info: {
    description: "Developer Only - Reloads Command",
  },
  async execute(ctx) {

    if (!ctx.client.ownerIds.includes(ctx.authorId)) return ctx.reply("This command is restricted to the bot owner.", { flags: 64 });

    const stats = reloadCommands(ctx.client);
    const interactions = stats.components;
    const total = stats.prefix + stats.jobs + stats.components + stats.slash;

    const embed = new EmbedBuilder()
      .setTitle("Commands has been reloaded!")
      .setDescription(
        [
          `* **Prefix:**  ${stats.prefix}`,
          `* **Awaited:** ${stats.jobs}`,
          `* **Interactions:** ${interactions}`,
          `* **Slash:** ${stats.slash}`,
        ].join("\n")
      )
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(`${total} Commands`)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("unimportantcustomid")
        .setDisabled(true)
    );

    await ctx.reply({ embeds: [embed], components: [row] });
  },
};
