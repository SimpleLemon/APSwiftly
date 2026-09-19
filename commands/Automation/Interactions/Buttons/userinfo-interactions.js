"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

async function isUserDmEnabled(user) {
  try {
    await user.send(" ");
    return true;
  } catch (error) {
    return error?.code !== 50007;
  }
}

function infoRow(userId, targetId, active) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("General info")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`mainmeminfo_${userId}_${targetId}`)
      .setDisabled(active === "mainmeminfo"),
    new ButtonBuilder()
      .setLabel("Member's Server info")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`memberservinfo_${userId}_${targetId}`)
      .setDisabled(active === "memberservinfo")
  );
}

module.exports = [
  {
    component: "button",
    customId: "memberservinfo",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }

      const member = await ctx.guild.members.fetch(ctx.parts[2]).catch(() => null);
      if (!member) {
        return ctx.reply(
          "The user appears to have left the server. The ablity to view their server information has been temporarily disabled until they re-join again",
          { flags: 64 }
        );
      }

      const { user } = member;
      const guild = ctx.guild;
      const avatar = user.displayAvatarURL({ size: 4096, forceStatic: false });
      const serverImage = guild.iconURL({ size: 4096, forceStatic: false }) ?? ctx.client.user.defaultAvatarURL;
      const roleIds = [...member.roles.cache.values()].filter((role) => role.id !== guild.id);
      const lowest = roleIds.sort((a, b) => a.position - b.position)[0] ?? null;
      const highest = member.roles.highest.id === guild.id ? null : member.roles.highest;

      const embed = new EmbedBuilder()
        .setAuthor({ name: "Server information", iconURL: serverImage })
        .setTitle(`Information for ${user.username}`)
        .setURL(`https://discord.com/users/${user.id}`)
        .addFields(
          {
            name: "**General**",
            value: [
              `* **Joined the server on:** <t:${Math.trunc(member.joinedTimestamp / 1000)}:f>`,
              `* **Booster:** ${member.premiumSince ? "Yes" : "No"}`,
              `* **Status:** ${member.presence?.status ?? "offline"}`,
            ].join("\n"),
            inline: true,
          },
          {
            name: "**Roles**",
            value: [
              `* **Total amount of roles:** ${member.roles.cache.size}`,
              `* **Highest Role:** ${highest?.name ?? "None"}`,
              `* **Lowest Role:** ${lowest?.name ?? "None"}`,
            ].join("\n"),
            inline: true,
          }
        )
        .setThumbnail(avatar)
        .setColor(ctx.getVar("embedcolor"));

      await ctx.update({ embeds: [embed], components: [infoRow(ctx.authorId, user.id, "memberservinfo")] });
    },
  },
  {
    component: "button",
    customId: "mainmeminfo",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }

      const user =
        ctx.client.users.cache.get(ctx.parts[2]) ??
        (await ctx.client.users.fetch(ctx.parts[2]).catch(() => null));
      if (!user) {
        return ctx.reply("Something went wrong while viewing this user's information.", { flags: 64 });
      }

      const avatar = user.displayAvatarURL({ size: 4096, forceStatic: false });
      const dmEnabled = await isUserDmEnabled(user);

      const embed = new EmbedBuilder()
        .setTitle(`Information for ${user.username}`)
        .setURL(`https://discord.com/users/${user.id}`)
        .addFields(
          {
            name: "**General**",
            value: [
              `* **Joined Discord on:** <t:${Math.trunc(user.createdTimestamp / 1000)}:f>`,
              `* **Bot account:** ${user.bot ? "Yes" : "No"}`,
              `* **ID:** ${user.id}`,
            ].join("\n"),
            inline: true,
          },
          {
            name: "**Other**",
            value: [`* **Avatar:** [link](${avatar})`, `* **DMs:** ${dmEnabled ? "Enabled" : "Disabled"}`].join("\n"),
            inline: true,
          }
        )
        .setThumbnail(avatar)
        .setColor(ctx.getVar("embedcolor"));

      await ctx.update({ embeds: [embed], components: [infoRow(ctx.authorId, user.id, "mainmeminfo")] });
    },
  },
];
