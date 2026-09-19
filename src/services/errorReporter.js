"use strict";

const { EmbedBuilder } = require("discord.js");
const { resolveLogChannel } = require("./logging");

/**
 * Centralized replacement for the aoi.js `functionError` event.
 * Logs to the console and, when configured, to the global error channel.
 */
function createErrorReporter(client, { logger }) {
  const recent = [];
  const DEDUPE_WINDOW = 5000;

  function shouldReport(error) {
    const key = String(error?.message ?? error);
    const now = Date.now();
    const last = recent.find((entry) => entry.key === key);
    if (last && now - last.at < DEDUPE_WINDOW) return false;
    recent.push({ key, at: now });
    if (recent.length > 50) recent.shift();
    return true;
  }

  return {
    report(error, meta = {}) {
      logger.error(`[error] ${meta.source ?? "unknown"}:`, error);
      if (!shouldReport(error)) return;
      this.notifyChannel(error, meta).catch((channelError) => {
        logger.error("[errorReporter] failed to notify channel:", channelError.message);
      });
    },

    async notifyChannel(error, meta = {}) {
      if (client.db.getVar("errorsystem") !== "on") return;
      if (String(client.db.getVar("errorsdisabled")) === "true") return;

      const channelId = client.db.getVar("errorchannel");
      if (!channelId || channelId === "none") return;

      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel?.isTextBased()) return;

      const stack = String(error?.stack ?? error?.message ?? error);
      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Error detected!",
          iconURL: client.user?.displayAvatarURL({ extension: "png", size: 128 }),
        })
        .setDescription(["**Error code**:", "```", stack.slice(0, 3000), "```"].join("\n"))
        .addFields({
          name: "**Information**",
          value: [
            `Function name: \`${error?.functionName ?? meta.source ?? "unknown"}\``,
            `Command name: \`${meta.command?.name ?? meta.commandName ?? "undefined"}\``,
            `Server: \`${meta.guild?.name ?? "unknown"}\` (\`${meta.guild?.id ?? "unknown"}\`)`,
          ].join("\n"),
        })
        .setColor("Yellow")
        .setFooter({ text: "Occurred on" })
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => {});
    },

    userMessage() {
      return "Something went wrong. Please try again later.";
    },
  };
}

module.exports = { createErrorReporter };
