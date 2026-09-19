"use strict";

const { Collection } = require("discord.js");

/**
 * Central registry for every migrated command/handler definition.
 *
 * Module shapes:
 *   prefix:    { name, aliases?, info?, cooldown?, ownerOnly?, execute(ctx) }
 *   slash:     { slash: { name, description, options?, ... }, execute(ctx) }
 *   component: { component: "button"|"select"|"modal", customId, execute(ctx) }
 *   event:     { event: "guildMemberAdd", once?, execute(ctx) }
 *   job:       { job: "remi", execute(payload, job, ctx) }
 */
class Registry {
  constructor() {
    this.prefixCommands = new Collection();
    this.aliases = new Map();
    this.slashCommands = new Collection();
    this.components = [];
    this.events = new Map();
    this.jobs = new Map();
    this.all = [];
    this.errors = [];
  }

  add(def, source = "unknown") {
    if (!def || typeof def !== "object") return this;

    // Skip helper modules that are imported for their functions, not registered
    // as commands (e.g. commands/Automation/Awaited/levelingresets.js).
    const isDefinition =
      Boolean(def.name) ||
      Boolean(def.component) ||
      Boolean(def.slash) ||
      typeof def.event === "string" ||
      typeof def.job === "string";
    if (!isDefinition) return this;

    def.source = source;
    if (source.startsWith("Developer/") || def.info?.dev) def.ownerOnly = true;
    if (isDefinition && typeof def.execute !== "function") { this.errors.push(`Missing execute in ${source}`); return this; }

    if (typeof def.job === "string") {
      this.jobs.set(def.job, def);
    }

    if (typeof def.event === "string") {
      const list = this.events.get(def.event) ?? [];
      list.push(def);
      this.events.set(def.event, list);
    }

    if (def.component) {
      this.components.push(def);
    }

    if (def.slash) {
      const name = (def.slash.name || def.name || "").toLowerCase();
      if (!name) {
        this.errors.push(`Slash definition without a name in ${source}`);
      } else {
        def.slash.name = name;
        if (this.slashCommands.has(name)) this.errors.push(`Duplicate slash command ${name}`);
        this.slashCommands.set(name, def);
      }
    }

    if (def.name && !def.component && !def.slash && typeof def.event !== "string" && typeof def.job !== "string") {
      const name = String(def.name).toLowerCase();
      if (this.prefixCommands.has(name)) this.errors.push(`Duplicate prefix command ${name}`);
      this.prefixCommands.set(name, def);

      const aliases = def.aliases ? (Array.isArray(def.aliases) ? def.aliases : [def.aliases]) : [];
      for (const alias of aliases) {
        const key = String(alias).toLowerCase();
        if (this.aliases.has(key)) {
          this.errors.push(`Duplicate alias "${key}" (${source})`);
        }
        this.aliases.set(key, def);
      }
    }

    this.all.push(def);
    return this;
  }

  resolvePrefix(name) {
    const key = String(name).toLowerCase();
    return this.prefixCommands.get(key) ?? this.aliases.get(key) ?? null;
  }

  commandExists(name) {
    return Boolean(this.resolvePrefix(name) || this.slashCommands.get(String(name).toLowerCase()));
  }

  findComponent(type, customId) {
    const matches = [];
    for (const def of this.components) {
      if (def.component !== type) continue;
      const matcher = def.customId;
      if (typeof matcher === "function") {
        if (matcher(customId, def)) matches.push(def);
      } else if (matcher instanceof RegExp) {
        if (matcher.test(customId)) matches.push(def);
      } else if (typeof matcher === "string") {
        if (matcher === customId || customId.startsWith(`${matcher}_`) || customId.startsWith(`${matcher}:`)) {
          matches.push(def);
        }
      }
    }
    return matches;
  }

  stats() {
    return {
      prefix: this.prefixCommands.size,
      aliases: this.aliases.size,
      slash: this.slashCommands.size,
      components: this.components.length,
      events: [...this.events.values()].reduce((sum, list) => sum + list.length, 0),
      jobs: this.jobs.size,
      total: this.all.length,
      errors: this.errors,
    };
  }
}

module.exports = { Registry };
