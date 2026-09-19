"use strict";

const { Events } = require("discord.js");

/**
 * Maps legacy aoi.js event names to discord.js events.
 * `once` marks events bound with client.once.
 */
const EVENT_MAP = {
  ready: { name: Events.ClientReady, once: true },
  guildJoin: { name: Events.GuildCreate },
  guildLeave: { name: Events.GuildDelete },
  join: { name: Events.GuildMemberAdd },
  leave: { name: Events.GuildMemberRemove },
  memberUpdate: { name: Events.GuildMemberUpdate },
  memberAvailable: { name: Events.GuildMemberAvailable },
  membersChunk: { name: Events.GuildMembersChunk },
  messageDelete: { name: Events.MessageDelete },
  messageUpdate: { name: Events.MessageUpdate },
  messageDeleteBulk: { name: Events.MessageBulkDelete },
  channelCreate: { name: Events.ChannelCreate },
  channelUpdate: { name: Events.ChannelUpdate },
  channelDelete: { name: Events.ChannelDelete },
  channelPinsUpdate: { name: Events.ChannelPinsUpdate },
  roleCreate: { name: Events.GuildRoleCreate },
  roleUpdate: { name: Events.GuildRoleUpdate },
  roleDelete: { name: Events.GuildRoleDelete },
  banAdd: { name: Events.GuildBanAdd },
  banRemove: { name: Events.GuildBanRemove },
  guildUpdate: { name: Events.GuildUpdate },
  guildUnavailable: { name: Events.GuildUnavailable },
  emojiCreate: { name: Events.GuildEmojiCreate },
  emojiUpdate: { name: Events.GuildEmojiUpdate },
  emojiDelete: { name: Events.GuildEmojiDelete },
  stickerCreate: { name: Events.GuildStickerCreate },
  stickerUpdate: { name: Events.GuildStickerUpdate },
  stickerDelete: { name: Events.GuildStickerDelete },
  threadCreate: { name: Events.ThreadCreate },
  threadUpdate: { name: Events.ThreadUpdate },
  threadDelete: { name: Events.ThreadDelete },
  inviteCreate: { name: Events.InviteCreate },
  inviteDelete: { name: Events.InviteDelete },
  voiceStateUpdate: { name: Events.VoiceStateUpdate },
  presenceUpdate: { name: Events.PresenceUpdate },
  reactionAdd: { name: Events.MessageReactionAdd },
  reactionRemove: { name: Events.MessageReactionRemove },
  reactionRemoveEmoji: { name: Events.MessageReactionRemoveEmoji },
  reactionRemoveAll: { name: Events.MessageReactionRemoveAll },
  typingStart: { name: Events.TypingStart },
  userUpdate: { name: Events.UserUpdate },
  interactionCreate: { name: Events.InteractionCreate },
  functionError: null,
};

/** Builds the event context passed to ported event handlers. */
function buildContext(client, eventName, args) {
  const base = { client, db: client.db, services: client.services, helpers: client.helpers, eventName };
  switch (eventName) {
    case "ready":
      return { ...base, client: args[0] };
    case "guildJoin":
    case "guildLeave":
    case "guildUpdate":
    case "guildUnavailable":
      return { ...base, guild: args[0] };
    case "join":
      return { ...base, member: args[0], guild: args[0]?.guild, user: args[0]?.user };
    case "leave":
      return { ...base, member: args[0], guild: args[0]?.guild, user: args[0]?.user };
    case "memberUpdate":
      return { ...base, oldMember: args[0], newMember: args[1], member: args[1], guild: args[1]?.guild, user: args[1]?.user };
    case "memberAvailable":
      return { ...base, member: args[0], guild: args[0]?.guild };
    case "membersChunk":
      return { ...base, members: args[0], guild: args[1] };
    case "messageDelete":
      return { ...base, message: args[0], guild: args[0]?.guild ?? null, channel: args[0]?.channel ?? null, author: args[0]?.author ?? null };
    case "messageUpdate":
      return { ...base, oldMessage: args[0], newMessage: args[1], message: args[1], guild: args[1]?.guild ?? null, channel: args[1]?.channel ?? null };
    case "messageDeleteBulk":
      return { ...base, messages: args[0], channel: args[1], guild: args[1]?.guild ?? null };
    case "channelCreate":
    case "channelUpdate":
    case "channelDelete":
    case "channelPinsUpdate":
      return { ...base, channel: args[0], guild: args[0]?.guild ?? null };
    case "roleCreate":
    case "roleUpdate":
    case "roleDelete":
      return { ...base, role: args[0], guild: args[0]?.guild ?? null };
    case "banAdd":
    case "banRemove":
      return { ...base, ban: args[0], guild: args[0]?.guild ?? null, user: args[0]?.user ?? null };
    case "emojiCreate":
    case "emojiUpdate":
    case "emojiDelete":
      return { ...base, emoji: args[0], guild: args[0]?.guild ?? null };
    case "stickerCreate":
    case "stickerUpdate":
    case "stickerDelete":
      return { ...base, sticker: args[0], guild: args[0]?.guild ?? null };
    case "threadCreate":
    case "threadUpdate":
    case "threadDelete":
      return { ...base, thread: args[0], guild: args[0]?.guild ?? null };
    case "inviteCreate":
    case "inviteDelete":
      return { ...base, invite: args[0], guild: args[0]?.guild ?? null };
    case "voiceStateUpdate":
      return { ...base, oldState: args[0], newState: args[1], guild: args[1]?.guild ?? null };
    case "presenceUpdate":
      return { ...base, oldPresence: args[0], newPresence: args[1], guild: args[1]?.guild ?? null };
    case "reactionAdd":
    case "reactionRemove":
      return { ...base, reaction: args[0], user: args[1], guild: args[0]?.message?.guild ?? null };
    case "reactionRemoveEmoji":
      return { ...base, reaction: args[0], guild: args[0]?.message?.guild ?? null };
    case "reactionRemoveAll":
      return { ...base, message: args[0], guild: args[0]?.guild ?? null };
    case "typingStart":
      return { ...base, typing: args[0] };
    case "userUpdate":
      return { ...base, oldUser: args[0], newUser: args[1], user: args[1] };
    default:
      return { ...base, args };
  }
}

/**
 * Binds every registered event handler to the discord.js client.
 * `functionError` is handled by the centralized error reporter, not here.
 */
function bindEvents(client) {
  for (const [name, listener] of client.registryEventBindings ?? []) client.removeListener(name, listener);
  client.registryEventBindings = [];
  for (const [eventName, defs] of client.registry.events.entries()) {
    if (eventName === "alwaysExecute") continue;

    const mapping = EVENT_MAP[eventName];
    if (!mapping || !mapping.name) {
      client.logger.warn?.(`[events] no discord.js mapping for "${eventName}" (${defs.length} handlers)`);
      continue;
    }

    const dispatcher = async (...args) => {
      for (const def of defs) {
        const ctx = buildContext(client, eventName, args);
        try {
          await def.execute(ctx);
        } catch (error) {
          client.logger.error?.(`[event:${eventName}] ${def.source} failed:`, error);
          client.services.errorReporter?.report(error, { source: `event:${eventName}:${def.source}`, guild: ctx.guild ?? ctx.newMember?.guild, user: ctx.user });
        }
      }
    };

    if (mapping.once && client.isReady()) continue;
    client.registryEventBindings.push([mapping.name, dispatcher]);
    if (mapping.once) client.once(mapping.name, dispatcher);
    else client.on(mapping.name, dispatcher);
  }
  return client;
}

module.exports = { EVENT_MAP, bindEvents, buildContext };
