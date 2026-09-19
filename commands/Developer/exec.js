"use strict";

const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const path = require("node:path");

const execAsync = promisify(exec);
const repoRoot = path.resolve(__dirname, "..", "..");

module.exports = {
  name: "execute",
  aliases: "exec",
  info: {
    description: "Runs terminal commands directly in Discord",
    perms: ["`SendMessages`"],
    dev: "true",
  },
  async execute(ctx) {
    if (!ctx.client.ownerIds.includes(ctx.authorId)) return;
    if (!ctx.rawArgs) return ctx.send("Please send a terminal command to be executed.");

    const { stdout, stderr } = await execAsync(ctx.rawArgs, { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
    const output = stderr ? `${stdout}${stdout ? "\n" : ""}${stderr}` : stdout;

    if (output.length >= 2000) {
      return ctx.send({ files: [{ attachment: Buffer.from(output, "utf8"), name: "result.txt" }] });
    }
    return ctx.send(`\`\`\`\n${output}\n\`\`\``);
  },
};
