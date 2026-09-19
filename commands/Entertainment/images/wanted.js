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

function avatarLink(user) {
  return user
    .displayAvatarURL({ size: 4096 })
    .replaceAll(".webp", ".png")
    .replaceAll(".gif", ".png");
}

module.exports = {
  name: "wanted",
  info: {
    description: "Adds a wanted poster into user's profile picture.",
    perms: ["`SendMessages`", "`AttachFiles`"],
  },
  cooldown: {
    time: 5000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const user = ctx.mentioned ?? ctx.author;
    const apiLink = `https://api.popcat.xyz/wanted?image=${avatarLink(user)}`;

    const permissions = ctx.channel?.permissionsFor(ctx.client.user);
    if (!permissions?.has(PermissionFlagsBits.AttachFiles)) {
      return ctx.send(
        "I must have `AttachFiles` permission in order to proceed in this channel. Please, grant me the permission and try again."
      );
    }

    if (!(await isImageLink(apiLink))) {
      return ctx.send("It looks like there're issues with processing the image. Please, try again later if possible.");
    }

    await ctx.send({ files: [new AttachmentBuilder(apiLink, { name: "wanted.png" })] });
  },
};
