"use strict";

const { config } = require("./src/config");
const { createBot } = require("./src/client");
const { createLogger } = require("./src/logger");
const { Events, ActivityType } = require("discord.js");

async function main() {
  const logger = createLogger({ debug: config.EnableDebugMode });
  const validationOnly = process.env.APSWIFTLY_VALIDATION === "1" || process.argv.includes("--validate");

  const client = createBot({ logger, connect: !validationOnly, ...(validationOnly ? { sqlitePath: ":memory:" } : {}) });

  client.once(Events.ClientReady, () => {
    client.user?.setPresence({
      status: "online",
      activities: [{ name: "/help | apstudy.org", type: ActivityType.Playing }],
    });
    logger.log(`Logged in as ${client.user?.tag ?? client.user?.username}`);
  });

  if (validationOnly) {
    client.services.slash.validate();
    const stats = client.registry.stats();
    logger.log("[validate] registry:", JSON.stringify(stats));
    client.sqlite.close();
    if (stats.errors.length) {
      for (const error of stats.errors) logger.error("[validate]", error);
      process.exitCode = 1;
    }
    return client;
  }

  await client.start();
  return client;
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal startup error:", error);
    process.exit(1);
  });
}

module.exports = { main };
