"use strict";

const { config } = require("../config");

/**
 * Default values for registered variables, mirroring the old
 * handlers/variables.js seeds. They are NOT written into SQLite on boot;
 * lookups fall back to these values when no record exists, exactly like
 * aoi.js kept its variable defaults in memory.
 */
const mainDefaults = {
  // Game variables
  trivia_type: "multiple",
  trivia_difficulty: "medium",
  flood_difficulty: 13,
  wyr: { upvotes: 0, downvotes: 0 },
  hangman_theme: "nature",
  // Main variables (do not touch)
  autopingreply: "off",
  includebots: "on",
  version: require("../../package.json").version,
  versionCodename: "Electric",
  libraryversiondevcheck: "off",
  buildStatus: "Complete",
  buildDate: "1736720758981",
  buildBranch: "v3",
  buildRevision: "0",
  showbuildinfo: "off",
  buildNumber: "2196",
  embedcolor: config.Embedcolor,
  originalembedcolor: config.Embedcolor,
  release_type: "Stable",
  DevReleaseTypeToSet: "Pre-release",
  prefix: config.prefix,
  originalprefix: config.prefix,
  // Feature variables
  suggestionchannel: "none",
  pollchannel: "none",
  welcomemessage: "Welcome to the server <username>!",
  welcomechannel: "none",
  welcometype: "text",
  welcomemessageembedcolor: "#1F8B4C",
  welcomesystem: "off",
  leavechannel: "none",
  leavesystem: "off",
  leavetype: "text",
  leavemessageembedcolor: "#ED4245",
  leavemessage: "Goodbye <username>! We now have <server.totalMembers> members left!",

  msgeventschannel: "none",
  servereventschannel: "none",
  membereventschannel: "none",
  msgdeletelog: "on",
  msgeditlog: "on",
  banneduserslog: "on",
  unbanneduserslog: "on",
  roleuserslog: "on",
  Integrationlog: "on",
  nicknameupdatelog: "on",
  nameupdatelog: "on",

  anonymous: "off",
  levelsystem: "off",
  level: "1",
  previouslevel: "0",
  xp: "0",
  xpLimit: "10",
  levelmessage: "<username> has leveled UP! Their level is now <newlevel>!",
  levelingmessagechannel: "none",
  levelmessagefeature: "off",
  levelleaveonreset: "off",
  islevelingreset: "no",
  levelingexcludedchannels: "none",
  levelingexcludedcategories: "none",
  // Developer & other variables
  errorchannel: "none",
  errorsystem: "off",
  startupchannel: "none",
  startupchannelsystem: "off",
  pre_release: "off",
  botinvitationmessage: "on",
  servermemberrequirement: "0",
  userapps: config.EnableUserApps,
  isuserappsalreadysetup: "no",
  errorsdisabled: config.DisableAllErrors,
};

const customDefaults = {
  hours: "0",
  checkinid: "",
  checkintimeoutid: "",
  channelid: "",
  useraitokenusage: "",
};

const defaults = {
  main: mainDefaults,
  custom: customDefaults,
};

function getDefault(table, name) {
  const scoped = defaults[table];
  if (!scoped) return undefined;
  return scoped[name];
}

function hasDefault(table, name) {
  return Boolean(defaults[table] && Object.prototype.hasOwnProperty.call(defaults[table], name));
}

/** Mirrors aoi.js VariableManager.parseData value coercion. */
function parseByType(value, defaultValue) {
  if (typeof defaultValue === "number") {
    const num = Number(value);
    return Number.isNaN(num) ? value : num;
  }
  if (defaultValue !== null && typeof defaultValue === "object") {
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

module.exports = { defaults, mainDefaults, customDefaults, getDefault, hasDefault, parseByType };
