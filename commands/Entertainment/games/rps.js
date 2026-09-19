"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { RockPaperScissors } = require("discord-gamecord");

const TIMEOUT_MS = 30_000;

function onePlayerRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("rpsrockbutton")
      .setLabel("Rock")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🌑")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("rpspaperbutton")
      .setLabel("Paper")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📰")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("rpsscissorsbutton")
      .setLabel("Scissors")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("✂️")
      .setDisabled(disabled)
  );
}

function scheduleTimeout(ctx, message) {
  setTimeout(async () => {
    try {
      const channel = await ctx.client.channels.fetch(message.channelId).catch(() => null);
      if (!channel?.messages) return;
      if (channel.guild) {
        const perms = channel.permissionsFor(ctx.client.user);
        if (perms && !perms.has(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages)) return;
      }

      const fetched = await channel.messages.fetch(message.id).catch(() => null);
      if (!fetched) return;

      const row = fetched.components?.[0];
      if (row?.components?.every((component) => component.disabled)) return;

      const embed = fetched.embeds[0];
      await fetched.edit({
        content: "Game has been ended due to inactivity.",
        embeds: [
          new EmbedBuilder()
            .setTitle(embed?.title ?? "")
            .setDescription(embed?.description ?? "")
            .setColor(ctx.getVar("embedcolor")),
        ],
        components: [onePlayerRow(true)],
      });
    } catch {
      /* message may have been deleted or is no longer editable */
    }
  }, TIMEOUT_MS);
}

async function onePlayer(ctx) {
  const embed = new EmbedBuilder()
    .setTitle("Rock Paper Scissors")
    .setDescription("The game has started!, What will you choose?")
    .setColor(ctx.getVar("embedcolor"));

  const message = await ctx.send({ embeds: [embed], components: [onePlayerRow(false)] });
  scheduleTimeout(ctx, message);
}

async function twoPlayer(ctx) {
  const game = new RockPaperScissors({
    message: ctx.message,
    isSlashGame: false,
    opponent: ctx.mentioned,
    embed: {
      title: "Rock Paper Scissors",
      color: ctx.getVar("embedcolor"),
      description: "Press a button below to make a choice.",
    },
    buttons: {
      rock: "Rock",
      paper: "Paper",
      scissors: "Scissors",
    },
    emojis: {
      rock: "🌑",
      paper: "📰",
      scissors: "✂️",
    },
    mentionUser: true,
    timeoutTime: 60000,
    buttonStyle: "SECONDARY",
    pickMessage: "You choose {emoji}.",
    winMessage: "**{player}** won the Game! Congratulations!",
    tieMessage: "The Game tied! No one won the Game!",
    timeoutMessage: "The Game went unfinished! No one won the Game!",
    playerOnlyMessage: "Only {player} and {opponent} can use these buttons.",
  });

  await game.startGame();
}

module.exports = {
  name: "rock-paper-scissors",
  aliases: "rps",
  info: {
    description: "Start a rps match with your opponent (or play against yourself optionally).",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const opponent = ctx.mentioned;

    if (!opponent) {
      return ctx.send(
        "Please mention a opponent to play with!\n\n**Tip:** Want to play against yourself? Mention yourself to do so!"
      );
    }
    if (opponent.bot) {
      return ctx.send("You cannot play with bots!");
    }
    if (opponent.id === ctx.authorId) {
      return onePlayer(ctx);
    }
    return twoPlayer(ctx);
  },
};
