"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const VOLUNTEER_FORM_URL = "https://forms.gle/R2LMVDcugiPwJFJZ9";

module.exports = {
  name: "join",
  info: {
    description: "Become APStudy Volunteer/Contributor",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!",
  },
  async execute(ctx) {
    const embed = ctx.embed(null, {
      title: "Volunteer for APStudy",
      color: "#FFD700",
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Apply Here!")
        .setStyle(ButtonStyle.Link)
        .setURL(VOLUNTEER_FORM_URL)
        .setEmoji("🔗")
    );

    const payload = { embeds: [embed], components: [row] };
    const referenceId = ctx.message?.reference?.messageId ?? null;

    if (referenceId) {
      await ctx.channel.send({ ...payload, reply: { messageReference: referenceId } });
    } else {
      await ctx.send(payload);
    }
  },
};
