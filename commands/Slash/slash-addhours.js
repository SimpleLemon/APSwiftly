"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { addHours } = require("../../src/services/hours");

const VOLUNTEER_GUILD_ID = "859910344393883710";
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
  slash: { name: "addhours" },
  info: {
    description: "Add volunteer hours to user.",
    perms: ["`Administrator`", "`Role: 1519016533005832332`"],
  },
  async execute(ctx) {
    if (ctx.guild?.id !== VOLUNTEER_GUILD_ID) {
      return ctx.reply("You tried.", { flags: 64 });
    }

    const isStaff =
      Boolean(ctx.member?.permissions?.has(PermissionFlagsBits.Administrator)) ||
      Boolean(ctx.member?.roles?.cache?.has(STAFF_ROLE_ID));
    if (!isStaff) {
      const embed = new EmbedBuilder()
        .setTitle("Missing Permissions")
        .setColor("#FF0000")
        .setDescription(`You need \`Administrator\` or the <@&${STAFF_ROLE_ID}> role to run this command.`);
      return ctx.reply({ embeds: [embed] }, { flags: 64 });
    }

    const user = ctx.options.getUser("user");
    const hours = ctx.options.getInteger("hours");

    await ctx.defer();

    const newTotal = await addHours(ctx.client, {
      targetUserId: user.id,
      amount: hours,
      actorId: ctx.authorId,
      guildId: ctx.guildId,
    });

    const dmEmbed = new EmbedBuilder()
      .setTitle("Volunteer Hours Update")
      .setColor("#FFFFFF")
      .setDescription(`<@!${ctx.authorId}> gave you \`${hours}\` hour(s).\nYou now have \`${newTotal}\` hour(s).`);

    try {
      const target = await ctx.client.users.fetch(user.id);
      await target.send({ embeds: [dmEmbed], components: [disabledReplyRow()] });
    } catch {
      /* legacy ignored closed DMs for this command */
    }

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("<a:tada:1324589971746586714> Volunteer Hours Added")
      .setDescription(
        `<@!${ctx.authorId}> added \`${hours}\` to <@!${user.id}>. They now have \`${newTotal}\` hours.`
      );

    await ctx.reply({ embeds: [embed] });
  },
};
