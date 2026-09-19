"use strict";

function databasePing(client) {
  const start = process.hrtime.bigint();
  client.db.getVar("version");
  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6;
}

module.exports = {
  slash: { name: "ping" },
  info: {
    description: "Returns the bot's Latency.",
  },
  async execute(ctx) {

    await ctx.reply("Pong! 🏓", { flags: 64 });

    const messagePing = Math.abs(Date.now() - ctx.interaction.createdTimestamp);
    const dbPing = databasePing(ctx.client).toFixed(1);
    const readyTimestamp = Math.trunc((ctx.client.readyTimestamp ?? Date.now()) / 1000);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    await ctx.interaction.editReply(
      [
        `Ping: ${ctx.client.ws.ping}`,
        `Message Ping: ${messagePing}`,
        `Database Ping: ${dbPing}`,
        `Last Restart: <t:${readyTimestamp}:f>`,
      ].join("\n")
    );
  },
};
