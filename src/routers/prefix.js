"use strict";

const { Context, normalizePayload } = require("../context");
const { humanizeDuration } = require("../utils/time");

function resolvePrefix(client, message) {
  if (!message.guild) return client.config.prefix;
  const guildPrefix = client.db.getGuildVar(message.guild.id, "prefix");
  return guildPrefix && guildPrefix !== "none" ? String(guildPrefix) : client.config.prefix;
}

/** Message-error semantics matching aoi.js `$onlyIf`/`$onlyPerms` failures. */
async function sendFailure(ctx, payload) {
  if (!payload) return;
  const normalized = normalizePayload(payload);
  if (ctx.interaction) {
    const options = normalized;
    if (!ctx.interaction.deferred && !ctx.interaction.replied) {
      await ctx.interaction.reply({ ...options, flags: options.flags });
    } else {
      await ctx.interaction.followUp({ ...options, flags: options.flags });
    }
    return;
  }
  await ctx.channel.send(normalized);
}

function matchCommand(client, content, prefix) {
  const body = content.slice(prefix.length).trim();
  const lower = body.toLowerCase();
  const candidates = [...client.registry.prefixCommands.values()];
  let best = null;
  let bestName = null;

  const check = (name, def) => {
    const expected = name.toLowerCase();
    const words = lower.split(" ");
    const candidate = words.slice(0, expected.split(" ").length).join(" ");
    if (candidate === expected && (!best || expected.length > bestName.length)) {
      best = def;
      bestName = expected;
    }
  };

  for (const def of candidates) {
    check(def.name, def);
    const aliases = def.aliases ? (Array.isArray(def.aliases) ? def.aliases : [def.aliases]) : [];
    for (const alias of aliases) check(alias, def);
  }

  if (!best) return null;

  // Exact aoi.js arg split: body after the command name, split on single
  // spaces with the first (empty) element discarded.
  const args = body.slice(bestName.length).split(" ").slice(1);
  return { command: best, name: bestName, args };
}

async function handlePrefixCommand(client, message, command, args) {
  const ctx = new Context({ client, command, args, message, prefix: resolvePrefix(client, message) });

  if (command.guildOnly !== false && !message.guild) return;
  if (command.dmOnly && message.guild) return;

  if (command.ownerOnly && !client.ownerIds.includes(message.author.id)) {
    await sendFailure(ctx, command.ownerOnlyMessage ?? "This command is restricted to the bot owner.");
    return;
  }

  if (message.guild && command.guildOnlyIds && !command.guildOnlyIds.includes(message.guild.id)) {
    await sendFailure(ctx, command.guildRestrictionMessage ?? "This command cannot be used in this server.");
    return;
  }

  if (!require("../services/commandAccess").canUseCommand(client, ctx, command)) {
    await sendFailure(ctx, "This command is not available to you here.");
    return;
  }

  if (command.cooldown) {
    const remaining = client.services.cooldowns.check(command.name, message.author.id, message.guild?.id ?? "dm");
    if (remaining > 0) {
      const expiry = Math.trunc((Date.now() + remaining) / 1000);
      const text = (command.cooldown.message ?? "Please wait %time% before using this command again.")
        .replaceAll("%time%", humanizeDuration(remaining))
        .replaceAll("%fullTime%", humanizeDuration(remaining))
        .replaceAll("%timestamp%", `<t:${expiry}:R>`);
      await sendFailure(ctx, { content: text });
      return;
    }
    client.services.cooldowns.set(command.name, message.author.id, message.guild?.id ?? "dm", command.cooldown.time);
  }

  try {
    const result = await command.execute(ctx);
    return result;
  } catch (error) {
    client.logger.error?.(`[prefix] ${command.name} failed:`, error);
    client.services.errorReporter?.report(error, { source: `command:${command.name}`, guild: message.guild, command });
    if (command.suppressErrors) {
      await sendFailure(ctx, command.suppressErrors);
    } else if (!client.config.DisableAllErrors) {
      await sendFailure(ctx, client.services.errorReporter?.userMessage(command, error) ?? "Something went wrong while running this command.");
    }
  }
}

async function routeMessage(client, message) {
  if (!message.content) return;
  if (message.webhookId || message.author?.bot) return;

  const prefix = resolvePrefix(client, message);

  if (prefix && message.content.toLowerCase().startsWith(prefix.toLowerCase())) {
    const match = matchCommand(client, message.content, prefix);
    if (match) {
      await handlePrefixCommand(client, message, match.command, match.args);
    }
  }

  // aoi.js `onMessage` order: commands, then $alwaysExecute.
  const always = client.registry.events.get("alwaysExecute") ?? [];
  for (const def of always) {
    try {
      await def.execute(buildMessageEventContext(client, message));
    } catch (error) {
      client.logger.error?.(`[alwaysExecute] ${def.source} failed:`, error);
    }
  }
}

function buildMessageEventContext(client, message) {
  return {
    client,
    db: client.db,
    services: client.services,
    helpers: client.helpers,
    message,
    guild: message.guild,
    channel: message.channel,
    member: message.member,
    author: message.author,
    user: message.author,
  };
}

module.exports = {
  routeMessage,
  handlePrefixCommand,
  resolvePrefix,
  sendFailure,
  matchCommand,
  buildMessageEventContext,
};
