"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const WARNING_THUMBNAIL = "https://us-east-1.tixte.net/uploads/dodo-bot.wants.solutions/warning.png";

function confirmationEmbed() {
  return new EmbedBuilder()
    .setTitle("Shutdown")
    .setDescription(
      "Do you really want to shutdown the bot? This will simply stop your bot from running. To turn on the bot, you need to go through your host to start it again."
    )
    .setColor("Red")
    .setThumbnail(WARNING_THUMBNAIL);
}

function confirmationRow(userId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("No")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`shutdownwithconfirmation_${userId}`)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setLabel("Yes")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`shutdownbyforce_${userId}`)
      .setDisabled(disabled)
  );
}

async function performShutdown(client) {
  try {
    await client.shutdown();
  } finally {
    process.exit(0);
  }
}

module.exports = [
  {
    name: "shutdown",
    info: {
      description: "Brings up a confirmation before shutting down the bot.",
      perms: ["`SendMessages`"],
      flags: ["`--now`"],
      dev: "true",
    },
    cooldown: {
      time: 2000,
      message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
    },
    async execute(ctx) {
      if (!ctx.client.ownerIds.includes(ctx.authorId)) return;

      if (ctx.args.some((arg) => arg === "--now" || arg === "—now")) {
        return performShutdown(ctx.client);
      }

      await ctx.send({ embeds: [confirmationEmbed()], components: [confirmationRow(ctx.authorId)] });
    },
  },
  {
    component: "button",
    customId: "shutdownbyforce",
    async execute(ctx) {
      if (!ctx.client.ownerIds.includes(ctx.authorId) || ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }

      await ctx.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("Please wait")
            .setDescription(`${ctx.client.user.username} is shutting down...`)
            .setColor("Green"),
        ],
        components: [],
      });

      await performShutdown(ctx.client);
    },
  },
  {
    component: "button",
    customId: "shutdownwithconfirmation",
    async execute(ctx) {
      if (!ctx.client.ownerIds.includes(ctx.authorId) || ctx.parts[1] !== ctx.authorId) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }

      await ctx.update({ embeds: [confirmationEmbed()], components: [confirmationRow(ctx.authorId, true)] });
      await ctx.followUp("The bot will continue to operate then.");
    },
  },
];
