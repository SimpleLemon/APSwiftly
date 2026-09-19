"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

function voteRow(tally) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel(String(tally.upvotes))
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("wyr1-votebutton")
      .setEmoji("1️⃣"),
    new ButtonBuilder()
      .setLabel(String(tally.downvotes))
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("wyr2-votebutton")
      .setEmoji("2️⃣")
  );
}

async function handleVote(ctx, option) {
  const messageId = ctx.message.id;
  const votedName = `wyr_hasuservoted_${ctx.authorId}`;

  if (ctx.db.getMessageVar(messageId, votedName, "main") === true) {
    return ctx.reply("You have already voted.", { flags: 64 });
  }

  const stored = ctx.db.getMessageVar(messageId, "wyr", "main");
  const tally = stored && typeof stored === "object" ? { ...stored } : {};
  tally.upvotes = Number(tally.upvotes) || 0;
  tally.downvotes = Number(tally.downvotes) || 0;
  tally[option] += 1;

  ctx.db.setMessageVar(messageId, votedName, true, "main");
  ctx.db.setMessageVar(messageId, "wyr", tally, "main");

  const fields = ctx.message.embeds[0]?.fields ?? [];

  await ctx.update({
    embeds: [
      new EmbedBuilder()
        .setTitle("Would you rather...")
        .addFields(
          { name: "**Option 1**", value: fields[0]?.value ?? "" },
          { name: "**Option 2**", value: fields[1]?.value ?? "" }
        )
        .setColor(ctx.getVar("embedcolor")),
    ],
    components: [voteRow(tally)],
  });
}

module.exports = [
  {
    component: "button",
    customId: "wyr1-votebutton",
    async execute(ctx) {
      await handleVote(ctx, "upvotes");
    },
  },
  {
    component: "button",
    customId: "wyr2-votebutton",
    async execute(ctx) {
      await handleVote(ctx, "downvotes");
    },
  },
];
