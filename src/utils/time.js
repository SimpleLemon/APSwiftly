"use strict";

/**
 * Mirrors aoi.js Time.parse for the units used by APSwiftly (`1m`, `1d`,
 * `1h`, `2s`, `1min`, `1mon`, `1w`, `1y`, `1ms`).
 * Returns milliseconds, or -1 when the input cannot be parsed.
 */
function parseTime(time) {
  if (time === undefined || time === null || time === "") return -1;
  if (typeof time === "number") return Number.isFinite(time) ? time : -1;
  if (typeof time !== "string") return -1;

  const input = time.trim();
  if (input === "") return -1;
  if (!Number.isNaN(Number(input))) return Number(input);

  const units = [
    { suffix: "mon", ms: 2628002880 },
    { suffix: "M", ms: 2628002880 },
    { suffix: "y", ms: 31536000000 },
    { suffix: "w", ms: 604800000 },
    { suffix: "d", ms: 86400000 },
    { suffix: "hr", ms: 3600000 },
    { suffix: "h", ms: 3600000 },
    { suffix: "min", ms: 60000 },
    { suffix: "ms", ms: 1 },
    { suffix: "m", ms: 60000 },
    { suffix: "s", ms: 1000 },
  ];

  let total = 0;
  let matchedAny = false;

  for (const part of input.split(" ")) {
    if (part === "") continue;
    let matched = false;
    for (const unit of units) {
      if (!part.endsWith(unit.suffix)) continue;
      const raw = part.slice(0, part.length - unit.suffix.length);
      if (raw === "" || Number.isNaN(Number(raw))) continue;
      total += Number(raw) * unit.ms;
      matched = true;
      matchedAny = true;
      break;
    }
    if (!matched) return -1;
  }

  return matchedAny ? total : -1;
}

/** Humanized representation used by aoi.js cooldown `%time%` placeholders. */
function humanizeDuration(ms) {
  let remaining = Math.abs(ms);
  const parts = [];
  const units = [
    ["years", 31536000000, "y"],
    ["months", 2628746000, "mon"],
    ["weeks", 604800000, "w"],
    ["days", 86400000, "d"],
    ["hours", 3600000, "h"],
    ["minutes", 60000, "m"],
    ["seconds", 1000, "s"],
  ];

  for (const [name, size, short] of units) {
    const amount = Math.trunc(remaining / size);
    remaining -= amount * size;
    if (amount) parts.push(`${amount}${short}`);
  }

  return parts.join(" ");
}

module.exports = { parseTime, humanizeDuration };
