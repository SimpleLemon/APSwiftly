"use strict";

/**
 * Native replacements for the `$autoList` helper and the `autoList*` awaited
 * commands. Menu interactions call these directly.
 */
const { autoList } = require("../services/autolist");

function splitConfigured(value) {
  const text = String(value ?? "none");
  if (text === "none" || text === "") return [];
  return text.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function renderList(client, guild, value, type) {
  const entries = splitConfigured(value);
  if (!entries.length) return "none";
  return entries.map((entry) => autoList(client, guild, entry, type)).join("\n");
}

module.exports = { splitConfigured, renderList };
