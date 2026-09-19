"use strict";

const { XP_VARS } = require("../../../src/services/leveling");

/**
 * Native replacements for the `resetonleave` / `resetleveling` awaited
 * commands. They are invoked directly by the leveling menu interactions.
 */
function resetUserOnLeave(client, guildId, userId) {
  for (const variable of XP_VARS) {
    client.db.deleteUserVar(guildId, userId, variable);
  }
}

function resetLeveling(client, guildId) {
  for (const variable of XP_VARS) {
    client.db.resetGuildUserVars(guildId, variable);
  }
  client.db.setGuildVar(guildId, "islevelingreset", "yes");
}

module.exports = { resetUserOnLeave, resetLeveling };
