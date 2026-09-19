"use strict";

/**
 * Authoritative slash-command registration table, mirroring the former
 * `$createApplicationCommand` calls exactly (names, descriptions, options,
 * default permissions, install/context scopes and target guilds).
 *
 * `integrationTypes`: 0 = GuildInstall, 1 = UserInstall
 * `contexts`: 0 = Guild, 1 = BotDM, 2 = PrivateChannel
 */
const GUILD_ALL = [0, 1, 2];
const USER_APPS = { integration_types: [0, 1], contexts: GUILD_ALL };
const USER_AND_GUILD = { integration_types: [0, 1], contexts: GUILD_ALL };

const SLASH_DEFINITIONS = {
  help: { description: "Show commands available to you in this server", integration_types: [0], contexts: [0] },
  // ---- global guild-install commands ---------------------------------
  echo: {
    description: "Echos message that you send.",
    integration_types: [0, 1],
    contexts: [0, 2],
    options: [{ type: 3, name: "message", description: "Input Message", required: true }],
  },
  reload: {
    description: "Developer Only - Reloads Command",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  },
  terminal: {
    description: "Developer Only - Run terminal commands on Discord",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [{ type: 3, name: "message", description: "Command to run in terminal", required: true }],
  },
  ai: {
    description: "Chat with AI",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [{ type: 3, name: "message", description: "Message to send to the AI", required: true }],
  },
  denied: {
    description: "Send denial message to user.",
    default_member_permissions: "8",
    integration_types: [0, 1],
    contexts: [0],
    options: [
      { type: 6, name: "user", description: "User", required: true },
      { type: 3, name: "name", description: "Applicant's Name", required: true },
      { type: 3, name: "reason", description: "Reason for Denial", required: true },
    ],
  },
  senddm: {
    description: "Send DM message to user.",
    default_member_permissions: "8",
    integration_types: [0, 1],
    contexts: [0],
    options: [
      { type: 6, name: "user", description: "User", required: true },
      { type: 3, name: "message", description: "Message to send", required: true },
    ],
  },
  latex: {
    description: "Send LaTeX message through image attachment.",
    integration_types: [0, 1],
    contexts: GUILD_ALL,
    options: [{ type: 3, name: "latex", description: "LaTeX message to send", required: true }],
  },
  addhours: {
    guildId: "859910344393883710",
    description: "Add volunteer hours to user.",
    integration_types: [0],
    contexts: [0],
    options: [
      { type: 6, name: "user", description: "User", required: true },
      { type: 4, name: "hours", description: "Hours", required: true },
    ],
  },
  ban: {
    description: "Ban a member",
    default_member_permissions: "4",
    integration_types: [0],
    contexts: [0],
    options: [
      { type: 6, name: "user", description: "User to ban", required: true },
      { type: 3, name: "reason", description: "Reason for ban" },
      {
        type: 3,
        name: "preserve_messages",
        description: "Preserve user messages or not",
        choices: [
          { name: "True", value: "true" },
          { name: "False", value: "false" },
        ],
      },
    ],
  },
  kick: {
    description: "Kick a member",
    default_member_permissions: "2",
    integration_types: [0],
    contexts: [0],
    options: [
      { type: 6, name: "user", description: "User to kick", required: true },
      { type: 3, name: "reason", description: "Reason for kick" },
    ],
  },
  contributor: {
    description: "Add an APStudy contributor",
    default_member_permissions: "8",
    integration_types: [0],
    contexts: [0],
    options: [
      { type: 6, name: "user", description: "Contributor @ User", required: true },
      { type: 3, name: "channelname", description: "Channel Name (ap-coursename)", required: true },
    ],
  },

  // ---- user-app commands ----------------------------------------------
  // `randomcolor`, `report` and `about` were deleted from the application by
  // the legacy `acreate` command and have no handlers, so they are intentionally
  // not part of the sync table.
  invite: { description: "Returns a link to invite the bot", ...USER_APPS },
  ping: { description: "Returns the bot's Latency", ...USER_APPS },
  avatar: {
    description: "Returns your/users profile picture.",
    ...USER_APPS,
    options: [{ type: 6, name: "user", description: "User to select to view avatar", required: false }],
  },
  banner: {
    description: "Returns your/users profile banner.",
    ...USER_APPS,
    options: [{ type: 6, name: "user", description: "User to select to view banner", required: false }],
  },
  reverse: {
    description: "Let's you reverse text",
    ...USER_APPS,
    options: [{ type: 3, name: "text", description: "Text to reverse", required: true }],
  },
  owoify: {
    description: "Makes text OWOifed",
    ...USER_APPS,
    options: [{ type: 3, name: "text", description: "Text to owoify", required: true }],
  },
  "8ball": {
    description: "Ask a question to 8ball",
    ...USER_APPS,
    options: [{ type: 3, name: "question", description: "The question to ask 8ball about", required: true }],
  },

  // ---- guild-scoped commands ------------------------------------------
  noreply: {
    guildId: "859910344393883710",
    description: "Send a no-reply channel reminder DM.",
    integration_types: [0],
    contexts: [0],
    options: [{ type: 6, name: "user", description: "User", required: true }],
  },
};

function buildDefinition(name) {
  const entry = SLASH_DEFINITIONS[name];
  if (!entry) return null;
  const { guildId, ...rest } = entry;
  if (guildId) { delete rest.contexts; delete rest.integration_types; }
  return { name, ...rest };
}

module.exports = { SLASH_DEFINITIONS, buildDefinition };
