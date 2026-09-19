"use strict";

const axios = require("axios");
const sharp = require("sharp");
const { AttachmentBuilder } = require("discord.js");

/**
 * Native replacement for the `$renderMath` DJS function.
 * Renders LaTeX to a PNG, posts it, and adds a trash-reaction delete.
 */
async function renderMath(channel, { expression, author, inline = false, scale = 1.2, pad = 20 }) {
  if (!channel?.isTextBased?.()) throw new Error("LaTeX requires a channel the bot can send to.");
  const encoded = encodeURIComponent(expression);
  const apiParam = inline ? "inline" : "from";
  const svgURL = `https://math.now.sh?${apiParam}=${encoded}&color=white`;
  const svg = (await axios.get(svgURL, { responseType: "text", timeout: 15000 })).data;

  const pngBuf = await sharp(Buffer.from(svg), { density: 3000 * Number(scale) })
    .flatten({ background: { r: 49, g: 51, b: 56, alpha: 1 } })
    .extend({
      top: Number(pad),
      bottom: Number(pad),
      left: Number(pad),
      right: Number(pad),
      background: { r: 49, g: 51, b: 56, alpha: 1 },
    })
    .resize({ height: 45, kernel: sharp.kernel.lanczos2 })
    .png()
    .toBuffer();

  const attachment = new AttachmentBuilder(pngBuf, { name: "equation.png" });
  const sent = await channel.send({
    content: `**Requested by <@${author.id}>**`,
    files: [attachment],
  });

  await sent.react("1367302883032301651").catch(() => {});
  const filter = (reaction, user) => reaction.emoji.id === "1367302883032301651" && user.id === author.id;
  const collector = sent.createReactionCollector({ filter, max: 1, time: 300_000 });
  collector.on("collect", () => sent.delete().catch(() => {}));

  return sent.attachments.first()?.url ?? null;
}

module.exports = { renderMath };
