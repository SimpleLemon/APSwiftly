"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  slash: { name: "invite" },
  info: {
    description: "Returns a link to invite the bot.",
  },
  async execute(ctx) {

    const invite = await ctx.client.generateInvite({
      scopes: ["bot", "applications.commands"],
      permissions: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ViewAuditLog,
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(`invite ${ctx.client.user.username}`)
      .setDescription("To invite the bot into a server, press the button below.")
      .setColor(ctx.getVar("embedcolor"));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Invite").setStyle(ButtonStyle.Link).setURL(invite)
    );

    await ctx.reply({ embeds: [embed], components: [row] }, { flags: 64 });
  },
};
