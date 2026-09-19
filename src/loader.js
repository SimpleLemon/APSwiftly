"use strict";

const fs = require("node:fs");
const path = require("node:path");

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

function flatten(moduleExports) {
  if (Array.isArray(moduleExports)) return moduleExports.flatMap(flatten);
  if (moduleExports && typeof moduleExports === "object") return [moduleExports];
  return [];
}

/**
 * Loads every command module under a root directory into the registry.
 * Exported objects/arrays are supported, matching the old command layout.
 */
function loadCommands(registry, rootDir, { logger = console, logCommands = false } = {}) {
  if (!fs.existsSync(rootDir)) return registry;
  let loadedFiles = 0;

  for (const file of walk(rootDir)) {
    let mod;
    try {
      mod = require(file);
    } catch (error) {
      registry.errors.push(`Failed to require ${path.relative(rootDir, file)}: ${error.message}`);
      logger.error?.(`[loader] failed to load ${file}:`, error);
      continue;
    }

    const defs = flatten(mod);
    for (const def of defs) registry.add(def, path.relative(rootDir, file));
    loadedFiles++;
    if (logCommands) logger.log?.(`[loader] ${path.relative(rootDir, file)} (${defs.length})`);
  }

  return registry;
}

module.exports = { loadCommands, walk, flatten };
