"use strict";

const axios = require("axios");
const { AttachmentBuilder, PermissionFlagsBits } = require("discord.js");

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36";

async function isImageLink(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      responseType: "stream",
      headers: { "User-Agent": CHROME_UA },
    });
    const contentType = String(response.headers["content-type"] ?? "");
    response.data?.destroy?.();
    return contentType.startsWith("image");
  } catch {
    return false;
  }
}

module.exports = {
  name: "comment",
  aliases: ["ytcomment"],
  info: {
    description: "Generates a parody image of YouTube comment with your username and profile picture.",
    perms: ["`SendMessages`", "`AttachFiles`"],
  },
  cooldown: {
    time: 5000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (ctx.rawArgs.length === 0) return ctx.send("Please Type something.");

    const avatar = ctx.author
      .displayAvatarURL({ size: 4096, extension: "webp" })
      .replaceAll(".webp", ".png")
      .replaceAll(".gif", ".png");
    const apiLink =
      `https://some-random-api.com/canvas/misc/youtube-comment?username=${encodeURIComponent(ctx.author.username)}` +
      `&avatar=${avatar}&comment=${encodeURIComponent(ctx.rawArgs)}`;

    const permissions = ctx.channel?.permissionsFor(ctx.client.user);
    if (!permissions?.has(PermissionFlagsBits.AttachFiles)) {
      return ctx.send(
        "I must have `AttachFiles` permission in order to proceed in this channel. Please, grant me the permission and try again."
      );
    }

    if (ctx.rawArgs.length > 56) {
      return ctx.send("Your comment can't be longer than 56 characters!");
    }

    if (!(await isImageLink(apiLink))) {
      return ctx.send("It looks like there're issues with processing the image. Please, try again later if possible.");
    }

    await ctx.send({ files: [new AttachmentBuilder(apiLink, { name: "comment.png" })] });
  },
};
