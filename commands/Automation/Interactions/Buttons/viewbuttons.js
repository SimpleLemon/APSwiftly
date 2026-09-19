"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { autoListText } = require("../../../../src/services/autolist");

async function permissionsInfo(ctx, botId) {
  const member = await ctx.guild.members.fetch(botId).catch(() => null);
  if (!member) return { error: "This bot is no longer in this server." };

  const perms = member.permissions.toArray();
  if (!perms.length) return { error: "This bot does not seem to have any permissions added to it." };

  return { perms, name: member.user.username };
}

function compactDescription(botName, perms) {
  return `**${botName}** has the following permissions:\n\n\`\`\`${perms.join(", ").toUpperCase()}\`\`\``;
}

function uncompactDescription(botName, perms) {
  const list = perms.map((perm) => autoListText(perm.toUpperCase())).join("\n");
  return `**${botName}** has the following permissions:\n\n\n${list}`;
}

function compactRow(botId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Uncompact")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`permsuncompactbutton_${botId}`)
  );
}

function uncompactRow(botId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Compact")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`permscompactbutton_${botId}`)
  );
}

module.exports = [
  {
    component: "button",
    customId: "viewcommandflags",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }

      const def = ctx.client.registry.resolvePrefix(ctx.parts[2]);
      const rawFlags = def?.info?.flags;
      const flags = rawFlags ? (Array.isArray(rawFlags) ? rawFlags : [rawFlags]) : [];

      const embed = new EmbedBuilder()
        .setTitle("Flags of this command")
        .setDescription(`The following flags are available for this command:\n\n${flags.join(", ")}`)
        .setColor(ctx.getVar("embedcolor"));

      await ctx.reply({ embeds: [embed] }, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "viewserverdescription",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }

      if (!ctx.guild?.description) {
        return ctx.reply("No description has been found for this server.", { flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setTitle("Description")
        .setDescription(`This server's description reads:\n\n${ctx.guild.description}`)
        .setColor(ctx.getVar("embedcolor"));

      await ctx.reply({ embeds: [embed] }, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "viewbotpermsbutton",
    async execute(ctx) {
      const botId = ctx.parts[1];
      const info = await permissionsInfo(ctx, botId);
      if (info.error) return ctx.reply(info.error, { flags: 64 });

      const embed = new EmbedBuilder()
        .setTitle("Permissions of this bot")
        .setDescription(compactDescription(info.name, info.perms))
        .setColor(ctx.getVar("embedcolor"));

      await ctx.reply({ embeds: [embed], components: [compactRow(botId)] }, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "permsuncompactbutton",
    async execute(ctx) {
      const botId = ctx.parts[1];
      const info = await permissionsInfo(ctx, botId);
      if (info.error) return ctx.reply(info.error, { flags: 64 });

      const embed = new EmbedBuilder()
        .setTitle("Permissions of this bot")
        .setDescription(uncompactDescription(info.name, info.perms))
        .setColor(ctx.getVar("embedcolor"));

      await ctx.update({ embeds: [embed], components: [uncompactRow(botId)] });
    },
  },
  {
    component: "button",
    customId: "permscompactbutton",
    async execute(ctx) {
      const botId = ctx.parts[1];
      const info = await permissionsInfo(ctx, botId);
      if (info.error) return ctx.reply(info.error, { flags: 64 });

      const embed = new EmbedBuilder()
        .setTitle("Permissions of this bot")
        .setDescription(compactDescription(info.name, info.perms))
        .setColor(ctx.getVar("embedcolor"));

      await ctx.update({ embeds: [embed], components: [compactRow(botId)] });
    },
  },
  {
    component: "button",
    customId: "whynoadminperm",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setTitle("Why this exists?")
        .setDescription(
          [
            "Administrator permission is generally dangerous and should only be given to people you trust. It is always a good idea to only select the required permissions, which is why `perms` command exists to raise awareness about this.",
            "",
            "This is also to reduce the chances of raiding in case the bot gets hacked by having less dangerous permissions.",
          ].join("\n")
        )
        .setColor(ctx.getVar("embedcolor"));

      await ctx.reply({ embeds: [embed] }, { flags: 64 });
    },
  },
];
