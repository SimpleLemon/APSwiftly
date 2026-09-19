"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "perms",
  info: {
    description: "Shows permissions the bot requires.",
    perms: "`SendMessages`",
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const embed = new EmbedBuilder()
      .setTitle("Permissions")
      .setDescription(
        [
          "Confused on what perms the bot should have? This list should help you decide the right permissions for the bot!",
          "",
          "For safety reasons, do not give the bot administrator permission under any circumstances.",
        ].join("\n")
      )
      .addFields(
        { name: "`ViewAuditLog`", value: "Required for logs such as moderation and Integration." },
        { name: "`AttachFiles`", value: "Required for image commands such as `gun`." },
        { name: "`AddReactions`", value: "Required for commands that use reactions." },
        { name: "`SendMessages`", value: "The most basic permission needed." },
        { name: "`ViewChannel`", value: "Required so the bot can read the user's messages executing it's command." }
      )
      .setColor(ctx.getVar("embedcolor"));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Why this exists?")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`whynoadminperm_${ctx.authorId}`)
        .setEmoji("❓")
    );

    await ctx.send({ embeds: [embed], components: [row] });
  },
};
