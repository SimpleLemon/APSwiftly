"use strict";

const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { sendWelcome, sendLeave } = require("../../../src/services/welcomer");
const { resolveLogChannel } = require("../../../src/services/logging");

function changedRoleMentions(oldMember, newMember, change = "added") {
  const newRoles = newMember?.roles?.cache;
  const oldRoles = oldMember?.roles?.cache;
  if (!newRoles || !oldRoles) return "";
  const changed =
    change === "removed"
      ? oldRoles.filter((role) => !newRoles.has(role.id))
      : newRoles.filter((role) => !oldRoles.has(role.id));
  return changed.map((role) => `<@&${role.id}>`).join(", ");
}

async function memberEventChannel(ctx) {
  if (!ctx.guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return null;
  return resolveLogChannel(ctx.client, ctx.guild, "membereventschannel");
}

module.exports = [
  {
    event: "join",
    async execute(ctx) {
      await sendWelcome(ctx.client, { guild: ctx.guild, user: ctx.user, member: ctx.member });
    },
  },
  {
    event: "leave",
    async execute(ctx) {
      await sendLeave(ctx.client, { guild: ctx.guild, user: ctx.user, member: ctx.member });
    },
  },
  {
    event: "memberUpdate",
    async execute(ctx) {
      const { client, guild, oldMember, newMember } = ctx;
      if (!guild || !oldMember || !newMember) return;

      const nicknameChanged = oldMember.nickname !== newMember.nickname;
      const usernameChanged = oldMember.user.username !== newMember.user.username;
      const added = changedRoleMentions(oldMember, newMember, "added");
      const removed = changedRoleMentions(oldMember, newMember, "removed");

      const wants =
        (nicknameChanged && client.db.getGuildVar(guild.id, "nicknameupdatelog") === "on") ||
        (usernameChanged && client.db.getGuildVar(guild.id, "nameupdatelog") === "on") ||
        (added && client.db.getGuildVar(guild.id, "roleuserslog") === "on") ||
        (removed && client.db.getGuildVar(guild.id, "roleuserslog") === "on");
      if (!wants) return;

      const channel = await memberEventChannel(ctx);
      if (!channel) return;

      const footer = { text: `User ID: ${newMember.id}` };
      const base = () =>
        new EmbedBuilder()
          .setAuthor({
            name: newMember.user.username,
            iconURL: newMember.user.displayAvatarURL({ extension: "png", size: 128 }),
          })
          .setFooter(footer)
          .setTimestamp()
          .setColor("Blue");

      if (nicknameChanged && client.db.getGuildVar(guild.id, "nicknameupdatelog") === "on") {
        await channel.send({
          embeds: [
            base()
              .setTitle("Nickname Change")
              .setDescription(`**Before:** ${oldMember.nickname ?? oldMember.user.username}\n**After:** ${newMember.nickname ?? newMember.user.username}`),
          ],
        });
      }

      if (usernameChanged && client.db.getGuildVar(guild.id, "nameupdatelog") === "on") {
        await channel.send({
          embeds: [
            base()
              .setTitle("Name Change")
              .setDescription(`**Before:** ${oldMember.user.username}\n**After:** ${newMember.user.username}`),
          ],
        });
      }

      if (added && client.db.getGuildVar(guild.id, "roleuserslog") === "on") {
        await channel.send({ embeds: [base().setTitle("Role Added").setDescription(added)] });
      }

      if (removed && client.db.getGuildVar(guild.id, "roleuserslog") === "on") {
        await channel.send({ embeds: [base().setTitle("Role Removed").setDescription(removed)] });
      }
    },
  },
];
