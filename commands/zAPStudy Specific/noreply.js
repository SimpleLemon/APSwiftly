"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const VOLUNTEER_GUILD_ID = "859910344393883710";
const CONTRIBUTOR_CATEGORY_ID = "1356279309169328158";
const STAFF_ROLE_ID = "1519016533005832332";

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
  slash: { name: "noreply" },
  info: {
    description: "Send a no-reply channel reminder DM to a user.",
    perms: ["`Role: 1519016533005832332`"],
  },
  async execute(ctx) {
    if (ctx.guild?.id !== VOLUNTEER_GUILD_ID) {
      return ctx.reply("You tried.", { flags: 64 });
    }

    if (ctx.channel?.parentId !== CONTRIBUTOR_CATEGORY_ID) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setColor("#FF0000")
        .setDescription("This command cannot be used here!");
      return ctx.reply({ embeds: [embed] }, { flags: 64 });
    }

    if (!ctx.member?.roles?.cache?.has(STAFF_ROLE_ID)) {
      const embed = new EmbedBuilder()
        .setTitle("Missing Permissions")
        .setColor("#FF0000")
        .setDescription(`You need the <@&${STAFF_ROLE_ID}> role to run this command.`);
      return ctx.reply({ embeds: [embed] }, { flags: 64 });
    }

    const user = ctx.options.getUser("user");

    await ctx.defer();

    const dmEmbed = new EmbedBuilder()
      .setTitle(`Message from ${ctx.author.username}`)
      .setColor("#FFFFFF")
      .setDescription(`Please check <#${ctx.channelId}> as soon as you can!\nSent from ${ctx.guild.name}`);

    let sent = false;
    try {
      const target = await ctx.client.users.fetch(user.id);
      await target.send({ embeds: [dmEmbed], components: [disabledReplyRow()] });
      sent = true;
    } catch {
      sent = false;
    }

    if (sent) {
      const embed = new EmbedBuilder()
        .setTitle("Success!")
        .setColor("#00FF00")
        .setDescription(`You have sent <@!${user.id}> a DM message`);
      return ctx.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle("Failed!")
      .setColor("Red")
      .setDescription(`<@!${user.id}> does not have their DMs open.`);
    return ctx.reply({ embeds: [embed] });
  },
};
