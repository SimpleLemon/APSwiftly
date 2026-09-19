"use strict";

const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { humanizeDuration } = require("../../src/utils/time");

const AI_ENDPOINT = "https://api.apstudy.org/ai/discord";
const AI_COOLDOWN_MS = 5000;

module.exports = {
  slash: { name: "ai" },
  info: {
    description: "Chat with AI",
  },
  async execute(ctx) {
    const message = ctx.options.getString("message");

    if (message.length < 5) {
      const embed = new EmbedBuilder()
        .setTitle("Message too short!")
        .setDescription("Try again with a proper message please! Wasting tokens is not nice.");
      return ctx.reply({ embeds: [embed] }, { flags: 64 });
    }

    if (message.length > 2000) {
      const embed = new EmbedBuilder()
        .setTitle("Message too long!")
        .setDescription("Try again with a shorter message please! The maximum input message is 2000 characters.");
      return ctx.reply({ embeds: [embed] }, { flags: 64 });
    }

    const cooldowns = ctx.client.services.cooldowns;
    const remaining = cooldowns.check("ai", ctx.authorId, ctx.guildId, "slash:ai");
    if (remaining > 0) {
      const wait = humanizeDuration(remaining);
      const embed = new EmbedBuilder()
        .setTitle("Slow down")
        .setDescription(
          "To prevent spam, please wait **%sec%** before using this command again!"
            .replaceAll("%sec%", wait)
            .replaceAll("%time%", wait)
        );
      return ctx.reply({ embeds: [embed] }, { flags: 64 });
    }
    cooldowns.set("ai", ctx.authorId, ctx.guildId, AI_COOLDOWN_MS, "slash:ai");

    await ctx.defer();

    let result;
    try {
      const response = await axios.get(AI_ENDPOINT, { params: { message }, timeout: 15000 });
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      result = data ?? null;
    } catch {
      return ctx.followUp("Something went wrong, please try again later.");
    }

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("APSwiftly AI")
      .setAuthor({
        name: ctx.author.username,
        iconURL: ctx.author.displayAvatarURL({ size: 4096 }),
      })
      .setDescription(String(result?.response ?? "Something went wrong, please try again later.").slice(0, 4096))
      .setFooter({ text: `Tokens Consumed - ${result?.usage?.total_tokens ?? "Unknown"}` });

    await ctx.followUp({ embeds: [embed] });
  },
};
