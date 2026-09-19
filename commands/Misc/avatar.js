"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { resolveUser } = require("../../src/utils/resolve");

module.exports = {
  name: "avatar",
  aliases: ["av", "userav"],
  info: {
    description: "Returns your/users profile picture.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const user = await resolveUser(ctx.client, ctx.arg(1), ctx.author);
    const url = user.displayAvatarURL({ extension: "png", size: 4096 });

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setImage(url)
      .setColor(ctx.getVar("embedcolor"));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Download").setStyle(ButtonStyle.Link).setURL(url)
    );

    await ctx.send({ embeds: [embed], components: [row] });
  },
};
