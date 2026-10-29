"use strict";

const sharp = require("sharp");
const { AttachmentBuilder } = require("discord.js");
const { mathjax } = require("mathjax-full/js/mathjax.js");
const { TeX } = require("mathjax-full/js/input/tex.js");
const { SVG } = require("mathjax-full/js/output/svg.js");
const { liteAdaptor } = require("mathjax-full/js/adaptors/liteAdaptor.js");
const { RegisterHTMLHandler } = require("mathjax-full/js/handlers/html.js");
require("mathjax-full/js/input/tex/ams/AmsConfiguration.js");
require("mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js");
require("mathjax-full/js/input/tex/textmacros/TextMacrosConfiguration.js");
require("mathjax-full/js/input/tex/color/ColorConfiguration.js");
require("mathjax-full/js/input/tex/mathtools/MathtoolsConfiguration.js");
require("mathjax-full/js/input/tex/cancel/CancelConfiguration.js");

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const background = { r: 49, g: 51, b: 56, alpha: 1 };

class LatexInputError extends Error {}

async function renderMathToPng(expression, { inline = false, scale = 1.2, pad = 20 } = {}) {
  if (typeof expression !== "string" || !expression.trim()) {
    throw new LatexInputError("Enter a LaTeX expression, for example: \\frac{5}{6}.");
  }
  if (expression.length > 4000) throw new LatexInputError("Keep your LaTeX expression under 4,000 characters.");
  if (!Number.isFinite(scale) || scale <= 0 || scale > 4 || !Number.isInteger(pad) || pad < 0 || pad > 100) {
    throw new Error("Invalid LaTeX rendering dimensions.");
  }
  let source = expression.trim();
  for (const [open, close] of [["$$", "$$"], ["\\[", "\\]"], ["\\(", "\\)"], ["$", "$"]]) {
    if (source.startsWith(open) && source.endsWith(close) && source.length >= open.length + close.length) {
      source = source.slice(open.length, -close.length).trim();
      break;
    }
  }
  if (!source) throw new LatexInputError("Enter a LaTeX expression inside the math delimiters.");

  // Each request gets its own macros/labels. No autoload, require or HTML
  // extensions: rendering uses bundled fonts and never fetches remote content.
  const tex = new TeX({
    packages: ["base", "ams", "newcommand", "textmacros", "color", "mathtools", "cancel"],
    maxMacros: 1000,
    maxBuffer: 8192,
    formatError: (_jax, error) => { throw new LatexInputError(error.message); },
  });
  const document = mathjax.document("", {
    InputJax: tex,
    OutputJax: new SVG({ fontCache: "none" }),
    compileError: (_document, _math, error) => { throw error; },
  });
  const node = document.convert(source, { display: !inline, em: 24, ex: 12, containerWidth: 1200 });
  const svg = adaptor.firstChild(node);
  // MathJax emits ex units; assign pixel dimensions before passing to sharp.
  const width = Math.ceil(parseFloat(adaptor.getAttribute(svg, "width")) * 12 * scale);
  const height = Math.ceil(parseFloat(adaptor.getAttribute(svg, "height")) * 12 * scale);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new LatexInputError("That expression has no visible math to render.");
  }
  if (width > 4096 || height > 2048 || width * height > 4_000_000) {
    throw new LatexInputError("That equation is too large. Try splitting it into smaller expressions.");
  }
  adaptor.setAttribute(svg, "width", String(width));
  adaptor.setAttribute(svg, "height", String(height));
  const markup = adaptor.outerHTML(svg).replace(/currentColor/g, "white");
  return sharp(Buffer.from(markup))
    .flatten({ background })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background })
    .png()
    .toBuffer();
}

/**
 * Native replacement for the `$renderMath` DJS function.
 * Renders LaTeX to a PNG, posts it, and adds a trash-reaction delete.
 */
async function renderMath(channel, { expression, author, inline = false, scale = 1.2, pad = 20 }) {
  if (!channel?.isTextBased?.()) throw new Error("LaTeX requires a channel the bot can send to.");
  const pngBuf = await renderMathToPng(expression, { inline, scale, pad });

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

module.exports = { renderMath, renderMathToPng, LatexInputError };
