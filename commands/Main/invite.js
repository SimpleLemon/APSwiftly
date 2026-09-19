"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "invite",
  info: {
    description: "Returns a link to invite the bot.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
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

    const embed = ctx.embed("To invite the bot into a server, press the button below.", {
      title: "invite APSwiftly",
      color: ctx.getVar("embedcolor"),
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Invite").setStyle(ButtonStyle.Link).setURL(invite)
    );

    await ctx.send({ embeds: [embed], components: [row] });
  },
};
