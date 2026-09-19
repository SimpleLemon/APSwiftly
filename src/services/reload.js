"use strict";

const path = require("node:path");
const { Registry } = require("../registry");
const { loadCommands, walk } = require("../loader");

const COMMANDS_DIR = path.join(__dirname, "..", "..", "commands");

/**
 * Hot-reloads every command module and atomically swaps the client registry.
 * Equivalent to the aoi.js `$updateCommands` behavior.
 */
function reloadCommands(client) {
  const files = walk(COMMANDS_DIR);
  for (const file of files) {
    delete require.cache[require.resolve(file)];
  }

  const registry = new Registry();
  loadCommands(registry, COMMANDS_DIR, {
    logger: client.logger,
    logCommands: client.config.LogCommands,
  });

  if (registry.errors.length) throw new Error(registry.errors.join("\n"));
  const previous = client.registry;
  client.registry = registry;
  try { client.services.slash.validate(); } catch (error) { client.registry = previous; throw error; }
  require("../events").bindEvents(client);
  client.services.scheduler.handlers.clear();
  for (const [type, def] of registry.jobs) client.services.scheduler.register(type, (payload, job) => def.execute(payload, job, client));
  return registry.stats();
}

module.exports = { reloadCommands, COMMANDS_DIR };
