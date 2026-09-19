"use strict";

const { EmbedBuilder } = require("discord.js");
const { httpJson } = require("../../src/utils/http");
const { randomColor } = require("../../src/utils/text");

module.exports = {
  name: "randomcolor",
  aliases: ["randomhex", "randomrgb"],
  info: {
    description: "Returns a random color that you can use.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 5000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const data = await httpJson(`https://api.popcat.xyz/color/${randomColor()}`);
    if (!data || typeof data !== "object") {
      return ctx.send("Unable to fetch data for randomcolor. Please, try again later.");
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Random Color",
        iconURL: "https://us-east-1.tixte.net/uploads/dodogames.wants.solutions/paintlarger.png",
      })
      .setTitle("There you go!")
      .addFields(
        { name: "**RGB code**", value: String(data.rgb ?? "Unknown") },
        { name: "**Hex code**", value: String(data.hex ?? "Unknown") }
      )
      .setColor(data.hex ?? ctx.getVar("embedcolor"))
      .setThumbnail(data.color_image ?? null);

    await ctx.send({ embeds: [embed] });
  },
};
