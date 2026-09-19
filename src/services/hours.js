"use strict";

const { EmbedBuilder } = require("discord.js");

const HOURS_TABLE = "custom";
const VOLUNTEER_LOG_CHANNEL_ID = "1519543164891955401";

function getHours(client, userId) {
  const value = client.db.getGlobalUserVar(userId, "hours", HOURS_TABLE);
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
}

/**
 * Single source of truth for volunteer-hour mutations so prefix and slash
 * commands cannot drift apart.
 */
async function addHours(client, { targetUserId, amount, actorId, guildId = null, log = true }) {
  const current = getHours(client, targetUserId);
  const newTotal = current + Number(amount);
  client.db.setGlobalUserVar(targetUserId, "hours", String(newTotal), HOURS_TABLE);

  if (log) {
    await logHoursAdded(client, { targetUserId, amount, actorId, newTotal, guildId });
  }

  return newTotal;
}

async function logHoursAdded(client, { targetUserId, amount, actorId, newTotal }) {
  try {
    const channel = await client.channels.fetch(VOLUNTEER_LOG_CHANNEL_ID);
    if (!channel?.isTextBased()) return;
    const embed = new EmbedBuilder()
      .setTitle("Volunteer Hours Added")
      .setDescription(
        [
          `**User:** <@!${targetUserId}>`,
          `**Hours added:** ${amount}`,
          `**Added by:** <@!${actorId}>`,
          `**New total:** \`${newTotal}\` hours`,
        ].join("\n")
      )
      .setColor("#00ff00")
      .setFooter({ text: "Volunteer hours log" })
      .setTimestamp();
    await channel.send({ embeds: [embed] });
  } catch (error) {
    client.logger.warn?.("[hours] failed to write volunteer log:", error.message);
  }
}

module.exports = { getHours, addHours, logHoursAdded, VOLUNTEER_LOG_CHANNEL_ID, HOURS_TABLE };
