"use strict";

const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const path = require("node:path");

const execAsync = promisify(exec);
const repoRoot = path.resolve(__dirname, "..", "..");

module.exports = {
  slash: { name: "terminal" },
  info: {
    description: "Developer Only - Run terminal commands on discord",
  },
  async execute(ctx) {

    if (!ctx.client.ownerIds.includes(ctx.authorId)) return ctx.reply("This command is restricted to the bot owner.", { flags: 64 });

    const command = ctx.options.getString("message");
    if (!command) {
      return ctx.reply("Please send a terminal command to be executed.", { flags: 64 });
    }

    await ctx.defer();
    let output;
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
      output = stderr ? `${stdout}${stdout ? "\n" : ""}${stderr}` : stdout;
    } catch (error) {
      output = `${error?.stdout ?? ""}${error?.stderr ?? ""}` || String(error);
    }

    if (output.length >= 2000) {
      return ctx.reply({ files: [{ attachment: Buffer.from(output, "utf8"), name: "result.txt" }] });
    }
    return ctx.reply(`\`\`\`\n${output}\n\`\`\``);
  },
};
