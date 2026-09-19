"use strict";

/** Mirrors $owoify: r|l -> w, R|L -> W. */
function owoify(text) {
  return String(text).replace(/r|l/g, "w").replace(/R|L/g, "W");
}

const SPECIAL_CHARS = ["+", "-", "/", "%", "&", "!", "?", "@", "^", "*", "<", ">", "$", "#", ".", "_", "=", "~", "|"];

/** Mirrors $excludeSpecialChars. */
function excludeSpecialChars(text) {
  let out = String(text);
  for (const char of SPECIAL_CHARS) out = out.split(char).join("");
  return out;
}

/** Mirrors $createProgressBar. */
function createProgressBar(value, max, barLength = 15) {
  const numericMax = Number(max) || 0;
  const progress = numericMax <= 0 ? 0 : Math.round((Math.max(Number(value), 0) / numericMax) * Number(barLength));
  const clamped = Math.min(Math.max(progress, 0), Number(barLength));
  return "=".repeat(clamped) + "-".repeat(Number(barLength) - clamped);
}

/** Mirrors $randomColor (user apps). */
function randomColor() {
  return Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0");
}

/** Mirrors $userURL. */
function userURL(userId) {
  return `https://discord.com/users/${userId}`;
}

/** Discord.js v14 removed discriminators; legacy users never have a tag. */
function hasUserTag() {
  return false;
}

/** Mirrors $autoList by mapping one text template over a separator-joined list. */
function autoList(text, separator, format) {
  if (text === undefined || text === null || text === "") return "";
  const values = String(text).split(separator);
  return values.map((value) => format.replaceAll("{value}", value)).join("\n");
}

function toDiscordTimestamp(ms, style = "f") {
  return `<t:${Math.trunc(Number(ms) / 1000)}:${style}>`;
}

module.exports = {
  owoify,
  excludeSpecialChars,
  createProgressBar,
  randomColor,
  userURL,
  hasUserTag,
  autoList,
  toDiscordTimestamp,
};
