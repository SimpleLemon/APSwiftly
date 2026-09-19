"use strict";

const { Context, normalizePayload } = require("../context");

class ComponentContext extends Context {
  constructor({ client, interaction, def }) {
    super({ client, interaction, command: def });
    this.client = client;
    this.interaction = interaction;
    this.command = def;
    this.db = client.db;
    this.services = client.services;
    this.helpers = client.helpers;

    this.customId = interaction.customId ?? "";
    this.parts = this.customId.split("_");
    this.values = interaction.values ?? [];
    this.user = interaction.user;
    this.author = interaction.user;
    this.member = interaction.member;
    this.guild = interaction.guild;
    this.channel = interaction.channel;
    this.message = interaction.message;
  }

  get guildId() {
    return this.guild?.id ?? null;
  }

  get channelId() {
    return this.channel?.id ?? null;
  }

  get authorId() {
    return this.user?.id ?? null;
  }

  get embedColor() {
    return this.db.getVar("embedcolor") ?? "#2A3759";
  }

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

  async reply(payload, options = {}) {
    const normalized = normalizePayload(payload);
    if (this.interaction.deferred && !this.interaction.replied) {
      const { flags, ...edit } = normalized;
      return this.interaction.editReply(edit);
    }
    if (this.interaction.replied) return this.interaction.followUp({ ...normalized, ...options });
    return this.interaction.reply({ ...normalized, ...options });
  }

  async update(payload) {
    return this.interaction.update(normalizePayload(payload));
  }

  async defer(options = {}) {
    if (!this.interaction.deferred && !this.interaction.replied) return this.interaction.deferReply(options);
    return undefined;
  }

  async followUp(payload, options = {}) {
    if (this.interaction.deferred && !this.interaction.replied) {
      const { flags, ...edit } = normalizePayload(payload);
      return this.interaction.editReply(edit);
    }
    return this.interaction.followUp({ ...normalizePayload(payload), ...options });
  }

  async showModal(modal) {
    return this.interaction.showModal(modal);
  }
}

async function handleComponent(client, interaction) {
  let type;
  if (interaction.isButton()) type = "button";
  else if (interaction.isAnySelectMenu()) type = "select";
  else if (interaction.isModalSubmit()) type = "modal";
  else return false;

  const matches = client.registry.findComponent(type, interaction.customId);
  if (!matches.length) return false;

  for (const def of matches) {
    const ctx = new ComponentContext({ client, interaction, def });
    try {
      const source = def.source || "";
      let permitted = true;
      const has = name => Boolean(ctx.member?.permissions?.has?.(name));
      if (source.includes("dev-panel-menu")) permitted = client.ownerIds.includes(ctx.authorId);
      else if (/settingsmenu-interactions|leveling-interactions/.test(source)) permitted = has("ManageGuild");
      else if (/welcomer-interactions|leave-interactions|logs-interaction/.test(source)) permitted = has("ManageChannels");
      else if (source.includes("slash-contributor")) permitted = has("Administrator");
      if (!permitted) { await ctx.reply("You no longer have permission to use this control.", { flags: 64 }); return true; }
      await def.execute(ctx);
    } catch (error) {
      client.logger.error?.(`[component] ${def.source} (${interaction.customId}) failed:`, error);
      client.services.errorReporter?.report(error, {
        source: `component:${def.source}`,
        guild: interaction.guild,
        user: interaction.user,
      });
      try {
        const message = "Something went wrong while handling this interaction.";
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({ content: message, flags: 64 });
        } else {
          await ctx.reply({ content: message, flags: 64 });
        }
      } catch {
        /* interaction already gone */
      }
    }
  }
  return true;
}

async function handleSlash(client, interaction) {
  const def = client.registry.slashCommands.get(interaction.commandName?.toLowerCase());
  if (!def) return false;

  const ctx = new ComponentContext({ client, interaction, def });
  ctx.options = interaction.options;
  if (!require("../services/commandAccess").canUseCommand(client, ctx, def)) {
    await ctx.reply("This command is not available to you here.", { flags: 64 });
    return true;
  }

  try {
    await def.execute(ctx);
    return true;
  } catch (error) {
    client.logger.error?.(`[slash] ${interaction.commandName} failed:`, error);
    client.services.errorReporter?.report(error, { source: `slash:${interaction.commandName}`, guild: interaction.guild });
    try {
      const message = "Something went wrong while running this command.";
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ content: message, flags: 64 });
      } else {
        await ctx.reply({ content: message, flags: 64 });
      }
    } catch {
      /* interaction already gone */
    }
    return true;
  }
}

async function routeInteraction(client, interaction) {
  if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
    return handleSlash(client, interaction);
  }
  return handleComponent(client, interaction);
}

module.exports = { routeInteraction, handleComponent, handleSlash, ComponentContext };
