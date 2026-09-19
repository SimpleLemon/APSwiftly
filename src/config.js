"use strict";

const fs = require("node:fs");
const path = require("node:path");

require("dotenv").config();

const DEFAULT_CONFIG = {
  prefix: "d!",
  Embedcolor: "#5865F2",
  MobileStatus: false,
  EnableDebugMode: false,
  DisableAllErrors: false,
  respondOnEdit: false,
  LogCommands: false,
  EnableUserApps: true,
};

function readConfigFile() {
  const file = path.join(__dirname, "..", "config.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function toBool(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function loadConfig() {
  const file = readConfigFile();

  const config = {
    ...DEFAULT_CONFIG,
    ...file,

    BotToken: firstDefined(process.env.BotToken, process.env.DISCORD_TOKEN, file.BotToken),
    DBsecurityKey: firstDefined(process.env.DBsecurityKey, file.DBsecurityKey),
    AOI_DB_PATH: firstDefined(process.env.AOI_DB_PATH, file.AOI_DB_PATH),
    SQLITE_PATH: firstDefined(process.env.SQLITE_PATH, file.SQLITE_PATH, path.join("database", "apswiftly.sqlite")),

    MobileStatus: toBool(firstDefined(process.env.MobileStatus, file.MobileStatus), DEFAULT_CONFIG.MobileStatus),
    EnableDebugMode: toBool(firstDefined(process.env.EnableDebugMode, file.EnableDebugMode), DEFAULT_CONFIG.EnableDebugMode),
    DisableAllErrors: toBool(firstDefined(process.env.DisableAllErrors, file.DisableAllErrors), DEFAULT_CONFIG.DisableAllErrors),
    respondOnEdit: toBool(firstDefined(process.env.respondOnEdit, file.respondOnEdit), DEFAULT_CONFIG.respondOnEdit),
    LogCommands: toBool(firstDefined(process.env.LogCommands, file.LogCommands), DEFAULT_CONFIG.LogCommands),
    EnableUserApps: toBool(firstDefined(process.env.EnableUserApps, file.EnableUserApps), DEFAULT_CONFIG.EnableUserApps),

    prefix: firstDefined(file.prefix, DEFAULT_CONFIG.prefix),
    Embedcolor: firstDefined(file.Embedcolor, DEFAULT_CONFIG.Embedcolor),
  };

  if (config.SQLITE_PATH !== ":memory:" && !path.isAbsolute(config.SQLITE_PATH)) {
    config.SQLITE_PATH = path.join(__dirname, "..", config.SQLITE_PATH);
  }

  return config;
}

const config = loadConfig();

module.exports = { config, loadConfig, DEFAULT_CONFIG, toBool };
