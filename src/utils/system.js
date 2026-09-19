"use strict";

const os = require("node:os");
const { version: discordVersion } = require("discord.js");

/** Returns a stable-ish CPU usage sample like aoi.js `$cpu` (process method). */
let lastCpu = { time: 0, usage: "0.00" };
function cpuUsage() {
  const start = Date.now();
  if (start - lastCpu.time > 5000) {
    const initial = process.cpuUsage();
    const begin = Date.now();
    while (Date.now() - begin < 1) {
      /* busy wait 1ms like aoi.js */
    }
    const final = process.cpuUsage(initial);
    lastCpu = { time: start, usage: ((final.user + final.system) / 1000).toFixed(2) };
  }
  return lastCpu.usage;
}

function ramUsage(type = "heapUsed") {
  const value = process.memoryUsage()[type] ?? 0;
  return (value / 1024 / 1024).toFixed(2);
}

function uptimeString(uptimeMs) {
  const totalSeconds = Math.trunc(uptimeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

module.exports = {
  cpuUsage,
  ramUsage,
  uptimeString,
  os,
  discordVersion,
  cpuModel: () => os.cpus()[0]?.model ?? "Unknown",
  platform: () => os.platform(),
};
