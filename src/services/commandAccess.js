"use strict";
const { PermissionFlagsBits: P } = require("discord.js");
const { GUILD_ID, CATEGORY_ID, STAFF_ROLE_ID } = require("./checkins");
const permissionByName = {
  settings: P.ManageGuild, leveling: P.ManageGuild, "prefix-reset": P.ManageGuild,
  leave: P.ManageChannels, logs: P.ManageChannels, welcomer: P.ManageChannels,
  "poll-set": P.ManageChannels, "poll-reset": P.ManageChannels,
  "suggest-set": P.ManageChannels, "suggest-reset": P.ManageChannels,
  poll: P.ManageMessages, bypass: P.ManageMessages, cheater: P.ManageMessages,
  noad: P.ManageMessages, scam: P.ManageMessages,
  contributor: P.Administrator, marketing: P.Administrator, denied: P.Administrator,
  senddm: P.Administrator, ban: P.BanMembers, kick: P.KickMembers
};
function canUseCommand(client, ctx, def) {
  const name = def.slash?.name || def.name;
  const has = permission => Boolean(ctx.member?.permissions?.has?.(permission));
  const role = id => Boolean(ctx.member?.roles?.cache?.has(id));
  if ((def.ownerOnly || ["terminal","reload","acreate"].includes(name)) && !client.ownerIds.includes(ctx.authorId)) return false;
  if (!ctx.guild && !def.slash && def.guildOnly !== false) return false;
  const slash = def.slash && require("../slash/definitions").SLASH_DEFINITIONS[name];
  if (slash?.guildId && ctx.guild?.id !== slash.guildId) return false;
  if (!ctx.guild && slash?.contexts && !slash.contexts.some(n=>n === 1 || n === 2)) return false;
  if (def.guildOnlyIds && !def.guildOnlyIds.includes(ctx.guildId)) return false;
  if (permissionByName[name] && !has(permissionByName[name])) return false;
  if (["checkin","grammar"].includes(name)) {
    if (ctx.channel?.parentId !== CATEGORY_ID || (!has(P.Administrator) && !role(STAFF_ROLE_ID))) return false;
    if (name === "checkin" && ctx.guild?.id !== GUILD_ID) return false;
  }
  if (name === "addhours" && (ctx.guild?.id !== GUILD_ID || (!has(P.Administrator) && !role(STAFF_ROLE_ID)))) return false;
  if (name === "archive" && (ctx.guild?.id !== GUILD_ID || !role("1319501912638226543"))) return false;
  if (name === "noreply" && (ctx.guild?.id !== GUILD_ID || ctx.channel?.parentId !== CATEGORY_ID || !role(STAFF_ROLE_ID))) return false;
  return true;
}
function category(def) {
  const source = def.source || "";
  if (def.ownerOnly || ["reload","terminal"].includes(def.slash?.name)) return "dev";
  if (/zVolunteer/.test(source) || def.slash?.name === "addhours") return "volunteer";
  if (/zAPStudy/.test(source) || def.slash?.name === "denied") return "apstudy";
  if (/Entertainment/.test(source) || ["8ball","echo","owoify","reverse"].includes(def.slash?.name)) return "entertainment";
  if (/Moderation/.test(source)) return "moderation";
  if (def.name === "leveling") return "leveling";
  if (/Main/.test(source) || ["help","ping","invite"].includes(def.slash?.name)) return "main";
  return "util";
}
module.exports = { canUseCommand, category };
