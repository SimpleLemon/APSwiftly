"use strict";

const { createBot } = require("../src/client");
const { config } = require("../src/config");

/**
 * Local slash-command registration script. Requires a live bot token and an
 * explicit opt-in, because it writes application commands to Discord.
 *
 * Usage:
 *   APSWIFTLY_ALLOW_REGISTRATION=1 node migration/register-slash.js [--guild <id>]
 */
async function main() {
  if (process.env.APSWIFTLY_ALLOW_REGISTRATION !== "1") {
    console.error(
      "Refusing to register slash commands without APSWIFTLY_ALLOW_REGISTRATION=1.\n" +
        "This writes to the live Discord application and must be run deliberately."
    );
    process.exit(1);
  }

  const token = process.env.BotToken || config.BotToken;
  if (!token) {
    console.error("No BotToken configured; cannot register slash commands.");
    process.exit(1);
  }

  const guildArgIndex = process.argv.indexOf("--guild");
  const guildId = guildArgIndex !== -1 ? process.argv[guildArgIndex + 1] : null;

  const client = createBot({ connect: false, token });
  client.rest.setToken(token);

  if (guildId) {
    const count = await client.services.slash.syncGuild(guildId);
    console.log(`Registered ${count} guild command(s) in ${guildId}.`);
  } else {
    const result = await client.services.slash.syncAll();
    console.log(`Registered ${result.globalCount} global and ${result.guildCount} guild command(s).`);
  }

  client.sqlite.close();
  process.exit(0);
}

main().catch((error) => {
  console.error("Slash registration failed:", error);
  process.exit(1);
});
