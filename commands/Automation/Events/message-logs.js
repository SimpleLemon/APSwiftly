"use strict";

const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { resolveLogChannel } = require("../../../src/services/logging");

module.exports = [
  {
    event: "messageDelete",
    async execute(ctx) {
      const { client, message } = ctx;
      if (!message?.guild) return;
      if (client.db.getGuildVar(message.guild.id, "includebots") !== "on" && client.db.getGuildVar(message.guild.id, "includebots") !== true && client.db.getGuildVar(message.guild.id, "includebots") !== "true" && message.author?.bot) return;
      if (client.db.getGuildVar(message.guild.id, "msgdeletelog") !== "on") return;
      if (!message.content && !message.attachments?.size) return;
      if (message.author?.id === client.user.id) return;

      const channel = await resolveLogChannel(client, message.guild, "msgeventschannel");
      if (!channel) return;

      const content = [message.content || "", ...(message.attachments?.map(a=>a.url) || [])].join("\n");
      if (content.length > 3800) {
        await channel.send({ files: [new AttachmentBuilder(Buffer.from(content), { name: "message-deleted.txt" })], allowedMentions: { parse: [] } });
        return;
      }
      const embed = new EmbedBuilder()
        .setAuthor({
          name: message.author?.username ?? "Unknown",
          iconURL: message.author?.displayAvatarURL?.({ extension: "png", size: 128 }),
        })
        .setTitle(`Message deleted in #${message.channel?.name ?? "unknown"}`)
        .setDescription(`${content}\n\nMessage ID: ${message.id}`)
        .setFooter({ text: `User ID: ${message.author?.id ?? "unknown"}` })
        .setTimestamp()
        .setColor("Red");

      await channel.send({ embeds: [embed] });
    },
  },
  {
    event: "messageUpdate",
    async execute(ctx) {
      const { client, oldMessage, newMessage } = ctx;
      const message = newMessage;
      if (!message?.guild) return;
      if (client.db.getGuildVar(message.guild.id, "includebots") !== "on" && client.db.getGuildVar(message.guild.id, "includebots") !== true && client.db.getGuildVar(message.guild.id, "includebots") !== "true" && message.author?.bot) return;
      if (client.db.getGuildVar(message.guild.id, "msgeditlog") !== "on") return;

      const oldContent = oldMessage?.content ?? "";
      const newContent = newMessage.content ?? "";
      if (!oldContent && !newContent) return;
      if (oldContent === newContent) return;
      if (message.author?.id === client.user.id) return;

      const channel = await resolveLogChannel(client, message.guild, "msgeventschannel");
      if (!channel) return;

      const url = message.url;
      const body = [
        `Member: <@${message.author?.id ?? "unknown"}>`,
        `Channel: <#${message.channelId}>`,
        `Message link: ${url}`,
        `Message ID: ${message.id}`,
        "",
        "Before:",
        oldContent,
        "",
        "After:",
        newContent,
      ].join("\n");

      const attachments = message.attachments?.map((attachment) => attachment.url) ?? [];
      const fileMode = oldContent.length + newContent.length > 3900;

      if (fileMode) {
        const withAttachments = attachments.length ? `${body}\n\nAttachments:\n\n${attachments.join("\n")}` : body;
        const file = new AttachmentBuilder(Buffer.from(withAttachments, "utf8"), { name: "msgedit-logs.txt" });
        await channel.send({ files: [file] });
        return;
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: message.author?.username ?? "Unknown",
          iconURL: message.author?.displayAvatarURL?.({ extension: "png", size: 128 }),
          url,
        })
        .setTitle(`Message edited in #${message.channel?.name ?? "unknown"}`)
        .setURL(url)
        .setDescription(`**Before:** ${oldContent}\n**After:** ${newContent}`)
        .setFooter({ text: `User ID: ${message.author?.id ?? "unknown"}` })
        .setColor("Blue")
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    },
  },
];
