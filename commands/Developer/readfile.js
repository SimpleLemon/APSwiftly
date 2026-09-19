"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");

module.exports = {
  name: "readfile",
  aliases: ["viewfile", "readcontent", "viewcontent"],
  info: {
    description: "Returns the contents of the file specified.",
    perms: ["`SendMessages`"],
    dev: "true",
  },
  async execute(ctx) {
    if (!ctx.client.ownerIds.includes(ctx.authorId)) return;
    if (!ctx.rawArgs) return ctx.send("You need to specify a path of the file to view.");

    const target = path.resolve(repoRoot, ctx.rawArgs);
    if (target !== repoRoot && !target.startsWith(repoRoot + path.sep)) {
      return ctx.send("This file doesn't seem to exist.");
    }

    let content;
    try {
      content = await fs.readFile(target, "utf8");
    } catch {
      return ctx.send("This file doesn't seem to exist.");
    }

    if (content.length >= 2000) {
      return ctx.send({ files: [{ attachment: Buffer.from(content, "utf8"), name: "output.js" }] });
    }
    return ctx.send(`\`\`\`\n${content}\n\`\`\``);
  },
};
