"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { parseTime } = require("../../src/utils/time");

const MAX_REMIND_MS = 1814400000;

const remiJob = {
  job: "remi",
  async execute(payload, job, client) {
    const user = await client.users.fetch(payload.author).catch(() => null);
    if (!user) return;

    const embed = new EmbedBuilder()
      .setTitle("Your Reminder!")
      .setTimestamp()
      .setDescription(`> ${payload.msg}\n\nCreated <t:${payload.time}:R>`)
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Link").setStyle(ButtonStyle.Link).setURL(payload.link)
    );

    await user.send({ embeds: [embed], components: [row] }).catch(() => {});
  },
};

module.exports = [
  {
    name: "remind",
    aliases: "rem",
    async execute(ctx) {
      const time = ctx.arg(1);
      const message = ctx.argsFrom(1);

      if (!time) {
        return ctx.send({ embeds: [ctx.embed("Enter a valid time.", { color: "Red" })] });
      }

      if (!ctx.arg(2)) {
        return ctx.send({ embeds: [ctx.embed("Enter a valid message to remind you.", { color: "Red" })] });
      }

      let dmEnabled = true;
      try {
        await ctx.author.send(" ");
      } catch (error) {
        dmEnabled = error?.code !== 50007;
      }
      if (!dmEnabled) {
        return ctx.send({ embeds: [ctx.embed("Your DM is closed, please open it.", { color: "Red" })] });
      }

      const ms = parseTime(time);
      if (ms === -1) {
        return ctx.send({ embeds: [ctx.embed("Enter a valid time with format like `1m/1d/1h`", { color: "Red" })] });
      }
      if (ms > MAX_REMIND_MS) {
        return ctx.send({ embeds: [ctx.embed("The maximum time limit is 21 days!", { color: "Red" })] });
      }

      const scheduler = ctx.client.services.scheduler;
      if (!scheduler.hasHandler("remi")) {
        scheduler.register("remi", (payload, job) => remiJob.execute(payload, job, ctx.client));
      }

      scheduler.addJob({
        type: "remi",
        executeAt: Date.now() + ms,
        payload: {
          link: `https://discord.com/channels/${ctx.guildId}/${ctx.channelId}/${ctx.message.id}`,
          time: String(Math.floor(Date.now() / 1000)),
          msg: message,
          author: ctx.authorId,
        },
      });

      await ctx.send({
        embeds: [ctx.embed(`> ${message}\nI will remind you in ${time}`, { title: "Reminder Added", color: "Green" })],
      });
    },
  },
  remiJob,
];
