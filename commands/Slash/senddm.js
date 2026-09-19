"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

function disabledReplyRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Don't reply — bot can't read.")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("unimportantcustomid2")
      .setDisabled(true)
  );
}

module.exports = {
  slash: { name: "senddm" },
  info: {
    description: "Send DM message to user.",
  },
  async execute(ctx) {
    if (!ctx.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
      return ctx.reply("You are missing `Administrator` permissions needed to run this command!", { flags: 64 });
    }

    const user = ctx.options.getUser("user");
    const message = ctx.options.getString("message");

    await ctx.defer({ flags: 64 });

    const dmEmbed = new EmbedBuilder()
      .setTitle(`Message from ${ctx.author.username}`)
      .setDescription(`\`\`\`${message}\`\`\`\nSent from ${ctx.guild?.name ?? ""}`)
      .setColor("#FFFFFF");

    let sent = false;
    try {
      const target = await ctx.client.users.fetch(user.id);
      await target.send({ embeds: [dmEmbed], components: [disabledReplyRow()] });
      sent = true;
    } catch {
      sent = false;
    }

    const embed = sent
      ? new EmbedBuilder()
          .setTitle("Success!")
          .setColor("#00FF00")
          .setDescription(`You have sent <@!${user.id}> a DM message`)
      : new EmbedBuilder()
          .setTitle("Failed!")
          .setColor("Red")
          .setDescription(`<@!${user.id}> does not have their DMs open.`);

    await ctx.reply({ embeds: [embed] });
  },
};
