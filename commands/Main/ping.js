"use strict";

function databasePing(client) {
  const start = process.hrtime.bigint();
  client.db.getVar("version");
  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6;
}

module.exports = {
  name: "ping",
  info: {
    description: "Returns the bot's Latency.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const sent = await ctx.send("Pong! 🏓");
    const messagePing = Date.now() - ctx.message.createdTimestamp;
    const dbPing = databasePing(ctx.client).toFixed(1);
    const readyTimestamp = Math.trunc((ctx.client.readyTimestamp ?? Date.now()) / 1000);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    await sent.edit(
      [
        `Ping: ${ctx.client.ws.ping}`,
        `Message Ping: ${messagePing}`,
        `Database Ping: ${dbPing}`,
        `Last Restart: <t:${readyTimestamp}:f>`,
      ].join("\n")
    );
  },
};
