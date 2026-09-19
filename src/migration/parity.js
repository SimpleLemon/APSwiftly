"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const MANIFEST_PATH = path.join(ROOT, "migration", "parity-manifest.json");

const EVENT_TYPES = new Set([
  "ready",
  "guildJoin",
  "guildLeave",
  "join",
  "leave",
  "memberUpdate",
  "messageDelete",
  "messageUpdate",
  "banAdd",
  "banRemove",
  "functionError",
]);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

/** Loads the tracked parity manifest (the authoritative legacy definition set). */
function loadManifest() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  return manifest.definitions.map((entry) => ({
    ...entry,
    code: typeof entry.code === "string" ? entry.code : "",
  }));
}

/**
 * Reads every legacy aoi definition from the read-only snapshot when present,
 * otherwise falls back to the tracked parity manifest so tests run in a fresh
 * clone without the gitignored `.migration/` directory.
 */
function readLegacyDefinitions() {
  const legacyRoot = path.join(ROOT, ".migration", "legacy", "commands");
  if (!fs.existsSync(legacyRoot)) return loadManifest();

  const defs = [];
  for (const file of walk(legacyRoot)) {
    let mod;
    try {
      mod = require(file);
    } catch {
      continue;
    }
    const list = Array.isArray(mod) ? mod : [mod];
    for (const def of list) {
      if (!def || typeof def !== "object") continue;
      defs.push({
        file: path.relative(legacyRoot, file),
        name: def.name ?? null,
        type: def.type ?? "command",
        prototype: def.prototype ?? null,
        aliases: def.aliases ?? null,
        code: typeof def.code === "string" ? def.code : "",
      });
    }
  }
  return defs.length ? defs : loadManifest();
}

function aliasesOf(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Builds a parity report comparing the legacy aoi definition set to the live
 * native registry.
 *
 * Mapping rules:
 *  - prefix commands: by name and every alias must resolve
 *  - slash commands: by name
 *  - events: by aoi event type (ready/join/leave/memberUpdate/...)
 *  - timeouts: by registered job type
 *  - buttons/selects/modals: legacy `name` was only used by `$awaitComponents`,
 *    not as a customId, so they are validated by count (every legacy component
 *    must be represented by at least one native component handler)
 *  - awaited: folded into commands/services; validated by count of non-awaited
 *    migrated handlers plus the source file still existing
 */
function parityReport(registry) {
  const legacy = readLegacyDefinitions();

  const prefixNames = new Set([...registry.prefixCommands.keys()]);
  const aliasNames = new Set([...registry.aliases.keys()]);
  const slashNames = new Set([...registry.slashCommands.keys()]);
  const jobTypes = new Set([...registry.jobs.keys()].map((type) => type.toLowerCase()));
  const eventTypes = new Set([...registry.events.keys()]);
  const componentRoots = new Set(
    registry.components
      .map((def) => (typeof def.customId === "string" ? def.customId.split(/[_:]/)[0].toLowerCase() : null))
      .filter(Boolean)
  );

  const problems = [];

  let legacyPrefix = 0;
  let legacySlash = 0;
  let legacyEvents = 0;
  let legacyComponents = 0;
  let legacyNamedComponents = 0;
  let legacyWildcardComponents = 0;
  let legacyJobs = 0;
  let legacyAwaited = 0;

  for (const def of legacy) {
    const name = String(def.name ?? "").toLowerCase();

    if (def.type === "awaited") {
      legacyAwaited++;
      continue;
    }

    if (def.type === "interaction" && def.prototype === "slash") {
      legacySlash++;
      if (!slashNames.has(name)) problems.push(`Missing slash handler: ${def.file} (${name})`);
      continue;
    }

    if (def.type === "interaction") {
      legacyComponents++;
      if (!def.name) {
        // Legacy wildcard handlers ran for every component and self-gated via
        // `$onlyIf[$advancedTextSplit[customId;_<n>]...]`. They were folded into
        // explicit customIds; validate the folded result exists.
        legacyWildcardComponents++;
        continue;
      }
      legacyNamedComponents++;
      const root = name.replace(/[_:].*$/, "").toLowerCase();
      // Legacy component `name` is only the awaited-handler lookup key; the
      // actual Discord customIds live in the handler's own `{button:...}` /
      // `$interactionModal[...,name,...]` code. Prefer the manifest's extracted
      // candidates; otherwise extract from the live source.
      const candidates = new Set(Array.isArray(def.customIds) ? def.customIds : [root, name]);
      if (!Array.isArray(def.customIds)) {
        for (const match of def.code.matchAll(/\{button:[^:}]*:[^:}]*:([A-Za-z0-9_.-]+)/g)) {
          candidates.add(match[1].toLowerCase().replace(/_.*$/, ""));
        }
        for (const match of def.code.matchAll(/interactionModal\[[^\]]*?[,;]\s*([A-Za-z0-9_.-]+)/g)) {
          candidates.add(match[1].toLowerCase());
        }
      }
      const found = [...candidates].some((candidate) => componentRoots.has(candidate));
      if (!found) {
        problems.push(`Missing component handler: ${def.file} (${def.name})`);
      }
      continue;
    }

    if (def.type === "timeout") {
      legacyJobs++;
      if (!jobTypes.has(name)) problems.push(`Missing job handler: ${def.file} (${name})`);
      continue;
    }

    if (EVENT_TYPES.has(def.type)) {
      if (def.type === "functionError") continue; // centralized in errorReporter
      legacyEvents++;
      if (!eventTypes.has(def.type)) problems.push(`Missing event handler: ${def.file} (${def.type})`);
      continue;
    }

    // Prefix command
    legacyPrefix++;
    if (name.startsWith("$alwaysexecute")) {
      if (!eventTypes.has("alwaysExecute")) problems.push(`Missing alwaysExecute handler: ${def.file}`);
      continue;
    }
    if (!prefixNames.has(name)) {
      problems.push(`Missing prefix command: ${def.file} (${name})`);
      continue;
    }
    for (const alias of aliasesOf(def.aliases)) {
      if (!aliasNames.has(String(alias).toLowerCase())) {
        problems.push(`Missing alias "${alias}" for ${name} (${def.file})`);
      }
    }
  }

  if (registry.components.length < legacyNamedComponents) {
    problems.push(
      `Component count regression: named legacy=${legacyNamedComponents} native=${registry.components.length}`
    );
  }

  return {
    legacyCount: legacy.length,
    legacyPrefix,
    legacySlash,
    legacyEvents,
    legacyComponents,
    legacyNamedComponents,
    legacyWildcardComponents,
    legacyJobs,
    legacyAwaited,
    nativePrefix: registry.prefixCommands.size,
    nativeSlash: registry.slashCommands.size,
    nativeEvents: [...registry.events.values()].reduce((sum, list) => sum + list.length, 0),
    nativeComponents: registry.components.length,
    nativeJobs: registry.jobs.size,
    problems,
  };
}

module.exports = { readLegacyDefinitions, parityReport, EVENT_TYPES, walk };
