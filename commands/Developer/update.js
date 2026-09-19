"use strict";

const path = require("node:path");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { Registry } = require("../../src/registry");
const { loadCommands, walk } = require("../../src/loader");

const COMMANDS_DIR = path.join(__dirname, "..", "..", "commands");

function reloadCommands(client) {
  for (const file of walk(COMMANDS_DIR)) {
    try {
      delete require.cache[require.resolve(file)];
    } catch {
      /* file is not cached or cannot be resolved; skip */
    }
  }

  const registry = new Registry();
  loadCommands(registry, COMMANDS_DIR, {
    logger: client.logger,
    logCommands: client.config?.LogCommands,
  });
  client.registry = registry;
  return registry;
}

module.exports = {
  name: "update",
  aliases: ["restartcmds", "reloadcmds", "reload"],
  info: {
    description: "Restarts commands to latest changes",
    perms: ["`SendMessages`"],
    dev: "true",
  },
  cooldown: {
    time: 4000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (!ctx.client.ownerIds.includes(ctx.authorId)) return;

    const stats = reloadCommands(ctx.client).stats();
    const total = stats.prefix + stats.jobs + stats.components + stats.slash;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Commands has been reloaded!",
        iconURL: ctx.client.user.displayAvatarURL({ extension: "png", size: 512 }),
      })
      .addFields({
        name: "Commands",
        value: [
          `* **Prefix:**  ${stats.prefix}`,
          `* **Awaited:** ${stats.jobs}`,
          `* **Interactions:** ${stats.components}`,
          `* **Slash:** ${stats.slash}`,
        ].join("\n"),
      })
      .setColor(ctx.getVar("embedcolor"));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(`Total: ${total}`)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("unimportantcustomid")
        .setDisabled(true)
    );

    await ctx.send({ embeds: [embed], components: [row] });
  },
};
