"use strict";

const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DEFAULTS = {
  embedColor: "#2A3759",
};

/** 1-indexed argument access matching aoi.js `$message[n]`. */
function arg(args, index) {
  return args[index - 1];
}

/** Mirrors `$messageSlice[n]`: everything from word n onward (1-indexed). */
function argsFrom(args, index) {
  return args.slice(index - 1).join(" ");
}

function chunk(text, size) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

function truncate(text, max) {
  const value = String(text ?? "");
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

class Context {
  constructor({ client, command, args = [], message = null, interaction = null, prefix = null }) {
    this.client = client;
    this.command = command;
    this.args = args;
    this.message = message;
    this.interaction = interaction;
    this.prefix = prefix;
    this.db = client.db;
    this.services = client.services;
    this.helpers = client.helpers;

    this.guild = message?.guild ?? interaction?.guild ?? null;
    this.channel = message?.channel ?? interaction?.channel ?? null;
    this.member = message?.member ?? interaction?.member ?? null;
    this.author = message?.author ?? interaction?.user ?? null;
    this.user = this.author;
  }

  // ---- argument helpers ----------------------------------------------
  arg(index) {
    return arg(this.args, index);
  }

  argsFrom(index) {
    return argsFrom(this.args, index);
  }

  get rawArgs() {
    return this.args.join(" ");
  }

  get mentioned() {
    return this.message?.mentions?.users?.first() ?? null;
  }

  // ---- permission helpers --------------------------------------------
  hasPerms(...perms) {
    if (!this.member) return false;
    return this.member.permissions.has(perms);
  }

  isAdministrator() {
    return this.hasPerms(PermissionFlagsBits.Administrator);
  }

  get guildId() {
    return this.guild?.id ?? null;
  }

  get channelId() {
    return this.channel?.id ?? null;
  }

  get authorId() {
    return this.author?.id ?? null;
  }

  // ---- variables ------------------------------------------------------
  getGuildVar(name, table = "main") {
    return this.guild ? this.db.getGuildVar(this.guild.id, name, table) : this.db.getVar(name, table);
  }

  setGuildVar(name, value, table = "main") {
    if (!this.guild) return value;
    return this.db.setGuildVar(this.guild.id, name, value, table);
  }

  getVar(name, table = "main") {
    return this.db.getVar(name, table);
  }

  setVar(name, value, table = "main") {
    return this.db.setVar(name, value, table);
  }

  getUserVar(name, table = "main") {
    return this.authorId && this.guildId ? this.db.getUserVar(this.guildId, this.authorId, name, table) : undefined;
  }

  setUserVar(name, value, table = "main") {
    if (!this.authorId || !this.guildId) return value;
    return this.db.setUserVar(this.guildId, this.authorId, name, value, table);
  }

  getGlobalUserVar(userId, name, table = "main") {
    return this.db.getGlobalUserVar(userId, name, table);
  }

  setGlobalUserVar(userId, name, value, table = "main") {
    return this.db.setGlobalUserVar(userId, name, value, table);
  }

  getChannelVar(name, table = "custom") {
    return this.channelId ? this.db.getChannelVar(this.channelId, name, table) : undefined;
  }

  setChannelVar(name, value, table = "custom") {
    if (!this.channelId) return value;
    return this.db.setChannelVar(this.channelId, name, value, table);
  }

  get embedColor() {
    return this.getVar("embedcolor") ?? DEFAULTS.embedColor;
  }

  // ---- messaging ------------------------------------------------------
  async send(payload) {
    return this.channel.send(payload);
  }

  async reply(payload, options = {}) {
    if (this.interaction) {
      if (this.interaction.deferred || this.interaction.replied) {
        return this.interaction.followUp(payload);
      }
      return this.interaction.reply(payload);
    }
    return this.message.reply({ ...options, ...normalizePayload(payload) });
  }

  embed(description, { color, title, footer, timestamp, fields } = {}) {
    const embed = new EmbedBuilder().setColor(color ?? this.embedColor);
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (footer) embed.setFooter({ text: footer });
    if (timestamp) embed.setTimestamp(timestamp === true ? new Date() : timestamp);
    if (fields) embed.addFields(fields);
    return embed;
  }

  errorEmbed(description, title = "Error") {
    return this.embed(description, { title, color: "#FF0000" });
  }
}

function normalizePayload(payload) {
  if (typeof payload === "string") return { content: payload };
  if (payload instanceof EmbedBuilder) return { embeds: [payload] };
  return payload;
}

module.exports = { Context, arg, argsFrom, chunk, truncate, normalizePayload, DEFAULTS };
