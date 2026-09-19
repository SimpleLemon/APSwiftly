"use strict";

const { Client, GatewayIntentBits, Partials, ActivityType, Events } = require("discord.js");

const { config } = require("./config");
const { createLogger } = require("./logger");
const { openDatabase } = require("./db/database");
const { Repository } = require("./db/repository");
const { Registry } = require("./registry");
const { loadCommands } = require("./loader");
const { createServices } = require("./services");
const { bindEvents } = require("./events");
const { routeMessage } = require("./routers/prefix");
const { routeInteraction } = require("./routers/interactions");
const helpers = require("./utils/text");

const INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.GuildEmojisAndStickers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.MessageContent,
];

const PARTIALS = [
  Partials.GuildMember,
  Partials.Channel,
  Partials.Message,
  Partials.Reaction,
  Partials.User,
  Partials.GuildScheduledEvent,
  Partials.ThreadMember,
];

function createBot({
  token = config.BotToken,
  ownerIds = (process.env.BOT_OWNER_IDS || process.env.OWNER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean),
  sqlitePath = config.SQLITE_PATH,
  logger = createLogger({ debug: config.EnableDebugMode }),
  commandsDir,
  connect = true,
} = {}) {
  const client = new Client({
    intents: INTENTS,
    partials: PARTIALS,
    rest: { timeout: 15000, retries: 0 },
  });

  client.config = config;
  client.logger = logger;
  client.ownerIds = ownerIds;
  client.helpers = helpers;
  client.registry = new Registry();
  client.sqlite = openDatabase(sqlitePath);
  client.db = new Repository(client.sqlite);
  client.services = createServices(client, { logger, sqlite: client.sqlite });

  loadCommands(client.registry, commandsDir ?? require("node:path").join(__dirname, "..", "commands"), {
    logger,
    logCommands: config.LogCommands,
  });

  for (const [type, def] of client.registry.jobs.entries()) {
    client.services.scheduler.register(type, (payload, job) => def.execute(payload, job, client));
  }

  client.on("messageCreate", (message) => {
    client.services.checkins.activity(message);
    routeMessage(client, message).catch((error) => logger.error("[router] message failed:", error));
  });
  client.on("interactionCreate", (interaction) => {
    routeInteraction(client, interaction).catch((error) => logger.error("[router] interaction failed:", error));
  });

  bindEvents(client);

  client.once(Events.ClientReady, async () => {
    try {
      client.controlServer = require("./services/controlServer").startControlServer(client);
      client.services.checkins.reconcileLegacy();
      await client.services.scheduler.start();
      await client.services.checkins.start();
    } catch (error) { logger.error("[startup] automation failed:", error); }
  });
  client.on("shardResume", () => client.services.checkins.scan());
  client.on("channelUpdate", (_old, channel) => {
    if (!client.services.checkins.eligible(channel)) client.services.checkins.cancelChannel(channel.id).catch(error => logger.error(error));
  });
  client.on("channelDelete", channel => client.services.checkins.cancelChannel(channel.id).catch(error => logger.error(error)));
  client.start = async () => {
    if (connect) {
      await client.login(token);
    }
    return client;
  };

  client.shutdown = async () => {
    client.controlServer?.close();
    client.services.checkins.stop();
    client.services.scheduler.stop();
    if (client.isReady()) await client.destroy();
  };

  return client;
}

module.exports = { createBot, INTENTS, PARTIALS };
