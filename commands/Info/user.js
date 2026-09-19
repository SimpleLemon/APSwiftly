"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { resolveUser } = require("../../src/utils/resolve");

async function isUserDmEnabled(user) {
  try {
    await user.send(" ");
    return true;
  } catch (error) {
    return error?.code !== 50007;
  }
}

module.exports = {
  name: "user",
  aliases: ["userinfo", "user-info"],
  info: {
    description: "Returns your/user's information.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const user = await resolveUser(ctx.client, ctx.arg(1), ctx.author);
    const avatar = user.displayAvatarURL({ size: 4096, forceStatic: false });
    const dmEnabled = await isUserDmEnabled(user);

    const embed = new EmbedBuilder()
      .setTitle(`Information for ${user.tag}`)
      .setURL(`https://discord.com/users/${user.id}`)
      .addFields(
        {
          name: "**Other**",
          value: [
            `* **Avatar:** [link](${avatar})`,
            `* **DMs:** ${dmEnabled ? "Enabled" : "Disabled"}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "**General**",
          value: [
            `* **Joined Discord on:** <t:${Math.trunc(user.createdTimestamp / 1000)}:f>`,
            `* **Bot account:** ${user.bot ? "Yes" : "No"}`,
            `* **ID:** ${user.id}`,
          ].join("\n"),
          inline: true,
        }
      )
      .setColor(ctx.getVar("embedcolor"))
      .setThumbnail(avatar);

    const components = [];
    if (ctx.guild) {
      const member =
        ctx.guild.members.cache.get(user.id) ??
        (await ctx.guild.members.fetch(user.id).catch(() => null));
      if (member) {
        components.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Member's Server info")
              .setStyle(ButtonStyle.Secondary)
              .setCustomId(`memberservinfo_${ctx.authorId}_${user.id}`),
            new ButtonBuilder()
              .setLabel("General info")
              .setStyle(ButtonStyle.Secondary)
              .setCustomId(`mainmeminfo_${ctx.authorId}_${user.id}`)
          )
        );
      }
    }

    await ctx.send({ embeds: [embed], components });
  },
};
