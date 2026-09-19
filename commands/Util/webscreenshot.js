"use strict";

const { AttachmentBuilder, EmbedBuilder } = require("discord.js");

async function isValidLink(url) {
  if (!url) return false;
  try {
    const response = await fetch(url, { method: "GET" });
    await response.body?.cancel().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  name: "webscreenshot",
  aliases: ["screenshot", "webss", "websitess", "ss"],
  info: {
    description: "Returns a screenshot of the given website.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Be Patient\nPlease wait for %time% to use this command again.",
  },
  async execute(ctx) {
    if (!(await isValidLink(ctx.arg(1)))) {
      return ctx.send("The link you've given isn't valid");
    }

    const attachment = new AttachmentBuilder(
      `https://image.thum.io/get/auth/11091-RandomBot/nomention/${ctx.rawArgs}`,
      { name: "screenshot.png" }
    );

    const embed = new EmbedBuilder()
      .setImage("attachment://screenshot.png")
      .setFooter({ text: `Requested by ${ctx.author.username}` });

    await ctx.send({ embeds: [embed], files: [attachment] });
  },
};
