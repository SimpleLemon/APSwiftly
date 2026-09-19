"use strict";

const { Routes, SlashCommandBuilder } = require("discord.js");
const { SLASH_DEFINITIONS, buildDefinition } = require("../slash/definitions");

/**
 * Native replacement for `$createApplicationCommand` / `$deleteApplicationCommand`.
 * Definitions come from src/slash/definitions.js so prefix, slash and user-app
 * variants cannot drift.
 *
 * Uses the REST API directly (not the gateway cache) so it works both from the
 * running bot and from the headless `migration/register-slash.js` script.
 */
class SlashService {
  constructor(client) {
    this.client = client;
    this._applicationId = null;
  }

  /** Resolves the application id without requiring a gateway connection. */
  async applicationId() {
    if (this.client.application?.id) return this.client.application.id;
    if (this.client.user?.id) return this.client.user.id;
    if (this._applicationId) return this._applicationId;
    const application = await this.client.rest.get(Routes.currentApplication());
    this._applicationId = application.id;
    return this._applicationId;
  }

  allDefinitions() {
    return Object.keys(SLASH_DEFINITIONS).map((name) => buildDefinition(name));
  }

  globalDefinitions() {
    return Object.entries(SLASH_DEFINITIONS)
      .filter(([, entry]) => !entry.guildId)
      .map(([name]) => buildDefinition(name));
  }

  guildDefinitions(guildId) {
    return Object.entries(SLASH_DEFINITIONS)
      .filter(([, entry]) => entry.guildId === String(guildId))
      .map(([name]) => buildDefinition(name));
  }

  validate() {
    const names = new Set(Object.keys(SLASH_DEFINITIONS));
    for (const name of this.client.registry.slashCommands.keys()) if (!names.has(name)) throw new Error(`Missing slash registration: ${name}`);
    for (const definition of this.allDefinitions()) {
      if (!this.client.registry.slashCommands.has(definition.name)) throw new Error(`Missing slash handler: ${definition.name}`);
      const builder = new SlashCommandBuilder().setName(definition.name).setDescription(definition.description);
      const methods = { 3: "addStringOption", 4: "addIntegerOption", 6: "addUserOption", 10: "addNumberOption" };
      for (const option of definition.options || []) {
        if (option.autocomplete && option.choices) throw new Error(`Conflicting choices/autocomplete: ${definition.name}.${option.name}`);
        if (!methods[option.type]) throw new Error(`Unsupported slash option type: ${option.type}`);
        builder[methods[option.type]](b => {
          b.setName(option.name).setDescription(option.description).setRequired(Boolean(option.required));
          if (option.choices) b.addChoices(...option.choices);
          return b;
        });
      }
      builder.toJSON();
    }
  }

  async syncIfChanged() {
    this.validate();
    const hash = require("node:crypto").createHash("sha256").update(JSON.stringify(SLASH_DEFINITIONS)).digest("hex");
    const previous = this.client.sqlite.prepare("SELECT v FROM meta WHERE k='slash_definition_hash'").get()?.v;
    if (previous === hash) return;
    await this.syncAll();
    this.client.sqlite.prepare("INSERT OR REPLACE INTO meta(k,v) VALUES ('slash_definition_hash',?)").run(hash);
  }

  async syncGlobal() {
    this.validate();
    const definitions = this.globalDefinitions();
    await this.client.rest.put(Routes.applicationCommands(await this.applicationId()), { body: definitions });
    return definitions.length;
  }

  async syncGuild(guildId) {
    this.validate();
    const definitions = this.guildDefinitions(guildId);
    if (!this.managedGuildIds().includes(String(guildId))) throw new Error("Refusing to sync an unmanaged guild");
    await this.client.rest.put(Routes.applicationGuildCommands(await this.applicationId(), guildId), { body: definitions });
    return definitions.length;
  }

  async deleteGlobal(name) {
    const applicationId = await this.applicationId();
    const commands = await this.client.rest.get(Routes.applicationCommands(applicationId)).catch(() => null);
    const target = commands?.find((command) => command.name === name);
    if (target) await this.client.rest.delete(Routes.applicationCommand(applicationId, target.id));
  }

  managedGuildIds() {
    const stored = this.client.sqlite.prepare("SELECT v FROM meta WHERE k='slash_managed_guilds'").get()?.v;
    return [...new Set(["859910344393883710", ...Object.values(SLASH_DEFINITIONS).map(entry=>entry.guildId).filter(Boolean), ...(stored ? JSON.parse(stored) : [])])];
  }

  /** Registers global, user-app and guild-scoped definitions. */
  async syncAll() {
    const globalCount = await this.syncGlobal();
    const guildIds = this.managedGuildIds();
    let guildCount = 0;
    for (const guildId of guildIds) guildCount += await this.syncGuild(guildId);
    this.client.sqlite.prepare("INSERT OR REPLACE INTO meta(k,v) VALUES ('slash_managed_guilds',?)").run(JSON.stringify(guildIds));
    return { globalCount, guildCount };
  }
}

module.exports = { SlashService };
