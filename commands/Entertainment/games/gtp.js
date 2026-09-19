"use strict";

const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { httpJson } = require("../../../src/utils/http");

const API_URL = "https://api.gamecord.xyz/pokemon";

function pokemonEmbed(ctx, pokemon, imageName) {
  return new EmbedBuilder()
    .setAuthor({
      name: ctx.author.username,
      iconURL: ctx.author.displayAvatarURL({ size: 256, forceStatic: false }),
    })
    .setTitle("Who's the Pokemon?")
    .addFields(
      { name: "Types", value: (pokemon.types ?? []).join(", "), inline: true },
      { name: "Abilities", value: (pokemon.abilities ?? []).join(", "), inline: true }
    )
    .setImage(`attachment://${imageName}`)
    .setColor(ctx.getVar("embedcolor"));
}

async function revealAnswer(ctx, message, pokemon, content, imageName, imageUrl) {
  await message
    .edit({
      content,
      embeds: imageName ? [pokemonEmbed(ctx, pokemon, imageName)] : [],
      files: imageName ? [new AttachmentBuilder(imageUrl, { name: imageName })] : [],
      attachments: [],
    })
    .catch(() => {});
}

module.exports = {
  name: "guess-the-pokemon",
  aliases: "gtp",
  info: {
    description: "Starts a game of guessing a Pokemon character.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 5000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const response = await httpJson(API_URL);
    const pokemon = response?.data;
    if (!pokemon || typeof pokemon !== "object") {
      return ctx.send("Unable to fetch Pokemon data.");
    }

    const message = await ctx.send("Please wait...");

    await message.edit({
      content: "",
      embeds: [pokemonEmbed(ctx, pokemon, "question-image.png")],
      files: [new AttachmentBuilder(pokemon.questionImage, { name: "question-image.png" })],
    });

    const collector = ctx.channel.createMessageCollector({
      filter: (msg) => msg.author.id === ctx.authorId && !msg.author.bot,
      time: 60000,
    });

    collector.on("collect", async (msg) => {
      const guess = msg.content.trim().split(/\s+/)[0];
      if (guess === pokemon.name) {
        collector.stop("guessed");
        await revealAnswer(
          ctx,
          message,
          pokemon,
          `You guessed it right! It was a ${pokemon.name}.`,
          "answer-image.png",
          pokemon.answerImage
        );
        return;
      }
      await revealAnswer(ctx, message, pokemon, `Better luck next time! It was a ${pokemon.name}.`);
    });

    collector.on("end", async (_collected, reason) => {
      if (reason === "guessed") return;
      await revealAnswer(ctx, message, pokemon, `Better luck next time! It was a ${pokemon.name}.`);
    });
  },
};
