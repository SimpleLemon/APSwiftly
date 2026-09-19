"use strict";

const { EmbedBuilder } = require("discord.js");
const { applyTemplate } = require("../utils/templates");

const XP_VARS = ["level", "previouslevel", "xp", "xpLimit"];

class LevelingService {
  constructor(client) {
    this.client = client;
  }

  async onMessage(ctx) {
    const { client } = this;
    const message = ctx.message;
    if (!message.guild || message.author?.bot) return;
    if (client.db.getGuildVar(message.guild.id, "levelsystem") !== "on") return;

    const excludedChannels = String(client.db.getGuildVar(message.guild.id, "levelingexcludedchannels") ?? "none");
    const excludedCategories = String(client.db.getGuildVar(message.guild.id, "levelingexcludedcategories") ?? "none");
    if (excludedChannels.includes(message.channelId)) return;

    const categoryId = message.channel?.parentId;
    if (categoryId && excludedCategories.includes(categoryId)) return;

    const remaining = client.services.cooldowns.check("alwaysExecute", message.author.id, message.guild.id);
    if (remaining > 0) return;
    client.services.cooldowns.set("alwaysExecute", message.author.id, message.guild.id, 2000);

    const userId = message.author.id;
    const guildId = message.guild.id;
    const db = client.db;

    let xp = Number(db.getUserVar(guildId, userId, "xp")) || 0;
    let xpLimit = Number(db.getUserVar(guildId, userId, "xpLimit")) || 10;
    let level = Number(db.getUserVar(guildId, userId, "level")) || 1;
    let previousLevel = Number(db.getUserVar(guildId, userId, "previouslevel")) || 0;

    xp += 1;
    db.setUserVar(guildId, userId, "xp", String(xp));
    db.setGuildVar(guildId, "islevelingreset", "no");

    if (xp < xpLimit) return;

    previousLevel = level;
    level += 1;
    xpLimit += 20;

    db.setUserVar(guildId, userId, "previouslevel", String(previousLevel));
    db.setUserVar(guildId, userId, "level", String(level));
    db.setUserVar(guildId, userId, "xpLimit", String(xpLimit));

    if (db.getGuildVar(guildId, "levelmessagefeature") !== "on") return;

    const template = client.db.getGuildVar(guildId, "levelmessage");
    const content = applyTemplate(template, {
      "<newlevel>": String(level),
      "<oldlevel>": String(previousLevel),
      "<mention>": `<@${userId}>`,
      "<username>": message.author.username,
      "<Displayname>": message.member?.displayName ?? message.author.username,
    });

    const channel = await client.services.logging.resolveLogChannel(client, message.guild, "levelingmessagechannel");
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setDescription(content)
      .setColor(ctx.db.getVar("embedcolor"));
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  }

  resetUser(guildId, userId) {
    for (const variable of XP_VARS) {
      this.client.db.deleteUserVar(guildId, userId, variable);
    }
  }

  resetGuild(guildId) {
    for (const variable of XP_VARS) {
      this.client.db.resetGuildUserVars(guildId, variable);
    }
    this.client.db.setGuildVar(guildId, "islevelingreset", "yes");
  }
}

module.exports = { LevelingService, XP_VARS };
