"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "commandinfo",
  aliases: ["cmdinfo", "ci"],
  info: {
    description: "The command says it all. What else do you expect?",
    perms: "`SendMessages`",
  },
  cooldown: {
    time: 2000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    if (ctx.args.length === 0) {
      return ctx.send("Enter a command name to view it's information about.");
    }

    const query = ctx.rawArgs.trim().toLowerCase();
    if (!ctx.client.registry.commandExists(query.replace(/^\//, ""))) {
      return ctx.send("The command specified does not appear to exist. Try entering a command that exists within the bot itself.");
    }

    const def = query.startsWith("/") ? ctx.client.registry.slashCommands.get(query.slice(1)) : ctx.client.registry.resolvePrefix(query) ?? ctx.client.registry.slashCommands.get(query);
    if (!def) {
      return ctx.send("The command specified does not appear to exist. Try entering a command that exists within the bot itself.");
    }

    if (!require("../../src/services/commandAccess").canUseCommand(ctx.client, ctx, def)) {
      return ctx.send("This command is not available to you here.");
    }

    const info = def.info ?? {};
    const aliases = def.aliases ? (Array.isArray(def.aliases) ? def.aliases : [def.aliases]) : [];
    const perms = info.perms ? (Array.isArray(info.perms) ? info.perms : [info.perms]) : [];
    const flags = info.flags ? (Array.isArray(info.flags) ? info.flags : [info.flags]) : [];

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Command info looker",
        iconURL: "https://us-east-1.tixte.net/uploads/dodo-bot.wants.solutions/search.png",
      })
      .setTitle(def.slash ? `/${def.slash.name}` : def.name)
      .setDescription(info.description || "No description available.")
      .addFields(
        { name: "Aliases", value: aliases.length ? aliases.join(", ") : "*No aliases exists for this command.*" },
        { name: "Permissions needed", value: perms.length ? perms.join(", ") : "None" }
      )
      .setColor(ctx.getVar("embedcolor"));

    const components = [];
    if (flags.length) {
      components.push(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Flags")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`viewcommandflags_${ctx.authorId}_${def.name}`)
        )
      );
    }

    await ctx.send({ embeds: [embed], components });
  },
};
