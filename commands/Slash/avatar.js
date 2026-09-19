"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  slash: { name: "avatar" },
  info: {
    description: "Returns your/users profile picture.",
  },
  async execute(ctx) {

    const user = ctx.options.getUser("user") ?? ctx.author;
    const url = user.displayAvatarURL({ extension: "png", size: 4096 });

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setImage(url)
      .setColor(ctx.getVar("embedcolor"));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Download").setStyle(ButtonStyle.Link).setURL(url)
    );

    await ctx.reply({ embeds: [embed], components: [row] }, { flags: 64 });
  },
};
