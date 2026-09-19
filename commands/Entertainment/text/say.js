"use strict";

const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { pick } = require("../../../src/utils/random");
const { randomColor, userURL } = require("../../../src/utils/text");

async function awaitedSay(ctx, message) {
  const content = message.content.replaceAll("--embed", "").replaceAll("—embed", "");
  if (content.length === 0) {
    return ctx.channel.send("You cannot activate embed mode without specifying a text first.");
  }

  const embedMode =
    message.content.includes("--embed") || message.content.includes("—embed") || message.content.length >= 2000;

  if (embedMode) {
    const links = pick([
      await ctx.client.generateInvite({
        scopes: ["bot", "applications.commands"],
        permissions: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.AddReactions,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ViewAuditLog,
        ],
      }),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ]);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL({ size: 4096 }),
        url: userURL(message.author.id),
      })
      .setTitle("Say Cmd!")
      .setURL(links)
      .setDescription(content)
      .setColor(`#${randomColor()}`)
      .setTimestamp();

    return ctx.channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  }

  return ctx.channel.send({
    content: `${content}\n\n- From [\`${message.author.username}\`](<${userURL(message.author.id)}>)`,
    allowedMentions: { parse: [] },
  });
}

module.exports = {
  name: "say",
  aliases: ["talk", "repeat"],
  info: {
    description: "Makes the bot say whatever you want (alongside with optional embed mode).",
    perms: ["`SendMessages`"],
    flags: ["`--embed`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    await ctx.send(
      "What do you want me to say?\n\n**Tip:** To use embed mode, make sure your message contains the flag `--embed` to do so."
    );

    const collected = await ctx.channel
      .awaitMessages({
        filter: (message) => message.author.id === ctx.authorId,
        max: 1,
        time: 30000,
        errors: ["time"],
      })
      .catch(() => null);

    const message = collected?.first();
    if (!message) return ctx.send("Time ran out! You didn't make me say anything!");

    await awaitedSay(ctx, message);
  },
};
