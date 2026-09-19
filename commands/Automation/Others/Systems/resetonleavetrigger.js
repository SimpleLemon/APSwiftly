"use strict";

const { XP_VARS } = require("../../../../src/services/leveling");

/** Port of the legacy leave trigger that resets a member's leveling data. */
module.exports = {
  event: "leave",
  async execute(ctx) {
    const { client, guild, member } = ctx;
    if (!guild) return;
    if (client.db.getGuildVar(guild.id, "levelsystem") !== "on") return;
    if (client.db.getGuildVar(guild.id, "levelleaveonreset") !== "on") return;

    const userId = member?.id ?? ctx.user?.id;
    if (!userId) return;

    for (const variable of XP_VARS) {
      client.db.deleteUserVar(guild.id, userId, variable);
    }
  },
};
