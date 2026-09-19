"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const CHECKMARK = "<:Checkmark:1370802219900735658>";
const CROSS = "<:Cross:1346672729675403437>";

function missingPermissionsEmbed(description) {
  return new EmbedBuilder()
    .setTitle(`${CROSS} Missing Permissions`)
    .setColor("#FF0000")
    .setDescription(description);
}

async function sendDirectMessage(client, userId, payload) {
  try {
    const user = await client.users.fetch(userId);
    await user.send(payload);
    return true;
  } catch (error) {
    if (error?.code === 50007) return false;
    return false;
  }
}

module.exports = {
  slash: { name: "ban" },
  info: {
    description: "Ban User",
    perms: ["`banmembers,sendmessages`"],
  },
  async execute(ctx) {
    const target = ctx.options.getUser("user");
    const reason = ctx.options.getString("reason") || "No Reason Given";
    const preserveMessages = ctx.options.getString("preserve_messages");

    if (target.id === ctx.authorId) {
      return ctx.reply(`${CROSS} You can't ban yourself genius.`, { flags: 64 });
    }

    if (target.id === ctx.guild.ownerId) {
      return ctx.reply(
        { embeds: [missingPermissionsEmbed("The user you are trying to ban is the server owner!")] },
        { flags: 64 }
      );
    }

    await ctx.defer({ flags: 64 });

    const targetMember = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (targetMember) {
      const authorPosition = ctx.member?.roles?.highest?.position ?? 0;
      const botPosition = ctx.guild.members.me?.roles?.highest?.position ?? 0;
      const targetPosition = targetMember.roles.highest.position;

      if (authorPosition <= targetPosition) {
        return ctx.reply(
          { embeds: [missingPermissionsEmbed("The user you are trying to ban has a higher role position!")] },
          { flags: 64 }
        );
      }

      if (botPosition <= targetPosition) {
        return ctx.reply(
          { embeds: [missingPermissionsEmbed("I do not have a high enough role position to ban this user!")] },
          { flags: 64 }
        );
      }
    }

    if (!ctx.member?.permissions?.has(PermissionFlagsBits.BanMembers)) {
      return ctx.reply({
        embeds: [missingPermissionsEmbed("You don't have `ban` permissions required to use this command!")],
      });
    }

    const dmEmbed = new EmbedBuilder()
      .setTitle("Banned")
      .setColor("#FFFFFF")
      .setDescription(`You have been **banned** from ${ctx.guild.name}.\nReason: ${reason}`);

    const dmSent = await sendDirectMessage(ctx.client, target.id, {
      embeds: [dmEmbed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Don't reply — bot can't read.")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("unimportantcustomid2")
            .setDisabled(true),
          new ButtonBuilder()
            .setLabel("Appeal")
            .setStyle(ButtonStyle.Link)
            .setURL("https://dyno.gg/form/a704d734")
        ),
      ],
    });

    await ctx.guild.members.ban(target.id, {
      deleteMessageSeconds: preserveMessages === "true" ? 0 : 604800,
      reason: `By ${ctx.author.username} for ${reason}`,
    });

    const embed = new EmbedBuilder()
      .setDescription(`${CHECKMARK} **${target.username} has been banned.**`)
      .setFooter({ text: dmSent ? "User was sent a DM message" : "User was not sent a DM message" })
      .setColor("#00FF00");

    await ctx.reply({ embeds: [embed] }, { flags: 64 });
  },
};
