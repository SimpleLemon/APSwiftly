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
  slash: { name: "denied" },
  info: {
    description: "Send denial message to user.",
  },
  async execute(ctx) {
    if (!ctx.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
      return ctx.reply("You are missing `Administrator` permissions needed to run this command!", { flags: 64 });
    }

    const user = ctx.options.getUser("user");
    const name = ctx.options.getString("name");
    const reason = ctx.options.getString("reason");

    await ctx.defer({ flags: 64 });

    const dmEmbed = new EmbedBuilder()
      .setTitle(`Dear ${name},`)
      .setDescription(
        [
          "**Thank you for applying to the APStudy Contributor Program**",
          "We regret to inform you that your application was not selected.",
          `\`\`\`Reason: ${reason}\`\`\`If anything changes, we will let you know.`,
          "",
          "Sincerely,",
          "APStudy Contributor Team",
        ].join("\n")
      )
      .setColor("#FFFFFF");

    let sent = false;
    try {
      const target = await ctx.client.users.fetch(user.id);
      await target.send({ embeds: [dmEmbed], components: [disabledReplyRow()] });
      sent = true;
    } catch {
      sent = false;
    }

    if (!sent) {
      const embed = new EmbedBuilder()
        .setTitle("Failed!")
        .setColor("Red")
        .setDescription(`<@!${user.id}> does not have their DMs open.`);
      return ctx.followUp({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle("Success!")
      .setColor("#00FF00")
      .setDescription(`You have sent <@!${user.id}> the denial message`);
    await ctx.followUp({ embeds: [embed] });
  },
};
