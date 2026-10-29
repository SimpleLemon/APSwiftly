"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const sharp = require("sharp");
const { renderMath, renderMathToPng, LatexInputError } = require("../src/services/renderMath");
const latex = require("../commands/Slash/slash-latex");

test("LaTeX renders real PNGs offline, including fractions, matrices and multiline equations", async t => {
  t.mock.method(axios, "get", () => { throw new Error("Rendering must not need the external API"); });
  for (const expression of [
    "5/6",
    String.raw`\frac{5}{6}`,
    String.raw`\int_0^1 x^2\,dx=\frac{1}{3}`,
    String.raw`\begin{pmatrix}1&2\\3&4\end{pmatrix}`,
    String.raw`\begin{aligned}a&=b+c\\d&=e-f\end{aligned}`,
  ]) {
    const png = await renderMathToPng(expression);
    const metadata = await sharp(png).metadata();
    assert.equal(metadata.format, "png");
    assert.ok(metadata.width > 40 && metadata.height > 40);
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([...data.subarray(0, 3)], [49, 51, 56]);
    let lightPixels = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) lightPixels++;
    }
    assert.ok(lightPixels > 10, "equation must contain visible white glyphs");
  }
});

test("common math delimiters render the same equation", async () => {
  const expected = await renderMathToPng(String.raw`\frac{5}{6}`);
  for (const expression of [String.raw`$\frac{5}{6}$`, String.raw`$$\frac{5}{6}$$`, String.raw`\[\frac{5}{6}\]`, String.raw`\(\frac{5}{6}\)`]) {
    assert.deepEqual(await renderMathToPng(expression), expected);
  }
});

test("bad input, excessive expansion and oversized output fail before sending", async () => {
  let sends = 0;
  const channel = { isTextBased: () => true, send: async () => { sends++; } };
  for (const expression of [
    "", " ", "$$$$", "x".repeat(4001), String.raw`\frac{5}{`,
    String.raw`\unknowncommand`, String.raw`\def\x{\x}\x`,
    String.raw`\rule{5000em}{1em}`, String.raw`\includegraphics{https://example.com/image.png}`,
  ]) {
    await assert.rejects(renderMath(channel, { expression, author: { id: "author" } }), LatexInputError);
  }
  assert.equal(sends, 0);
});

test("macros defined by one caller do not leak into another request", async () => {
  await renderMathToPng(String.raw`\newcommand{\privateMacro}{x^2}\privateMacro`);
  await assert.rejects(renderMathToPng(String.raw`\privateMacro`), LatexInputError);
  await renderMathToPng("x^2");
});

test("renderMath attaches the PNG and preserves author-only trash deletion", async () => {
  let payload, emoji, collectorOptions, onCollect, deleted = false;
  const message = {
    attachments: { first: () => ({ url: "https://cdn.example/equation.png" }) },
    react: async value => { emoji = value; },
    createReactionCollector(options) {
      collectorOptions = options;
      return { on(event, callback) { assert.equal(event, "collect"); onCollect = callback; } };
    },
    delete: async () => { deleted = true; },
  };
  const channel = { isTextBased: () => true, send: async value => { payload = value; return message; } };
  assert.equal(await renderMath(channel, { expression: "5/6", author: { id: "author" } }), "https://cdn.example/equation.png");
  assert.equal(payload.content, "**Requested by <@author>**");
  assert.equal(payload.files[0].name, "equation.png");
  assert.equal((await sharp(payload.files[0].attachment).metadata()).format, "png");
  assert.equal(emoji, "1367302883032301651");
  const reaction = { emoji: { id: emoji } };
  assert.equal(collectorOptions.filter(reaction, { id: "author" }), true);
  assert.equal(collectorOptions.filter(reaction, { id: "someone-else" }), false);
  onCollect();
  assert.equal(deleted, true);
});

test("slash command completes deferred errors without claiming success or pinging mentions", async () => {
  const replies = [];
  let deferred = false;
  const ctx = {
    options: { getString: () => String.raw`\badcommand` },
    author: { id: "author" },
    channel: { isTextBased: () => true, send: () => assert.fail("invalid input must not be sent") },
    client: { services: { renderMath } },
    defer: async () => { deferred = true; },
    reply: async payload => { assert.equal(deferred, true); replies.push(payload); },
  };
  await latex.execute(ctx);
  assert.equal(replies.length, 1);
  assert.match(replies[0].content, /couldn't render.*Undefined control sequence/);
  assert.deepEqual(replies[0].allowedMentions, { parse: [] });
  const error = new Error("Missing Attach Files permission");
  ctx.client.services.renderMath = async () => { throw error; };
  await assert.rejects(latex.execute(ctx), error);
  assert.equal(replies.length, 1, "a failed upload must not report success");
});
