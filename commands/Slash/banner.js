"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  slash: { name: "banner" },
  info: {
    description: "Returns your/users profile banner.",
  },
  async execute(ctx) {

    await ctx.defer({ flags: 64 });
    const selected = ctx.options.getUser("user") ?? ctx.author;
    const user = await ctx.client.users.fetch(selected.id, { force: true });
    const url = user.bannerURL({ extension: "png", size: 4096 });

    if (!url) {
      return ctx.reply("This user does not have a banner attached to their profile.", { flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Banner`)
      .setImage(url)
      .setColor(ctx.getVar("embedcolor"));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Download").setStyle(ButtonStyle.Link).setURL(url)
    );

    await ctx.reply({ embeds: [embed], components: [row] }, { flags: 64 });
  },
};
