"use strict";

/**
 * Native replacements for the `autoList*` awaited helpers. The legacy
 * `$autoList` custom function mapped these over separator-joined variable
 * values; menu interactions now call these directly.
 */
function autoListText(value) {
  if (value === "none") return "none";
  return `* ${value}`;
}

function autoListServers(client, value) {
  const guild = client.guilds.cache.get(String(value));
  return `* ${guild?.name ?? "Unknown Server"} - ${value}`;
}

function autoListChannels(guild, value) {
  if (value === "none") return "none";
  const channel = guild?.channels?.cache?.get(String(value));
  return channel ? `* <#${value}>` : "* `Deleted Channel`";
}

function autoListCategories(guild, value) {
  if (value === "none") return "none";
  const channel = guild?.channels?.cache?.get(String(value));
  return channel ? `* **${channel.name}**` : "* `Deleted Category`";
}

function autoListRoles(guild, value) {
  if (value === "none") return "none";
  const role = guild?.roles?.cache?.get(String(value));
  return role ? `* <@&${value}>` : "* `Deleted Role`";
}

function autoList(client, guild, value, type) {
  switch (type) {
    case "servers":
      return autoListServers(client, value);
    case "channels":
      return autoListChannels(guild, value);
    case "categories":
      return autoListCategories(guild, value);
    case "roles":
      return autoListRoles(guild, value);
    default:
      return autoListText(value);
  }
}

module.exports = {
  autoList,
  autoListText,
  autoListServers,
  autoListChannels,
  autoListCategories,
  autoListRoles,
};
