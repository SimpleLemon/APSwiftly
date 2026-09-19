"use strict";
const http = require("node:http");
const { timingSafeEqual } = require("node:crypto");
const { reloadCommands } = require("./reload");

function authorized(header, token) {
  const match = String(header || "").match(/^Bearer\s+(.+)$/i);
  if (!match || !token) return false;
  const supplied = Buffer.from(match[1]);
  const expected = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}
function createControlHandler(client, { token, shutdown = () => client.shutdown(), now = () => Date.now() }) {
  const startedAt = now();
  return async (req, res) => {
    req.resume?.();
    if (!authorized(req.headers.authorization, token)) return sendJson(res, 401, { success: false, error: "Unauthorized" });
    try {
      const pathname = new URL(req.url || "/", "http://localhost").pathname;
      if (req.method === "GET" && pathname === "/api/control/status") {
        return sendJson(res, 200, { ok: true, uptime_seconds: Math.floor((now()-startedAt)/1000),
          service: "apswiftly", loader_ready: Boolean(client.registry), discord_ready: client.isReady(),
          runtime: "discord.js", commands: client.registry.stats() });
      }
      if (req.method !== "POST") return sendJson(res, 405, { success: false, error: "Method not allowed" });
      if (pathname === "/api/control/reload") {
        const stats = reloadCommands(client);
        return sendJson(res, 200, { success: true, message: "Commands hot-reloaded successfully.", commands: stats });
      }
      if (pathname === "/api/control/refresh-slash") {
        await client.services.slash.syncAll();
        return sendJson(res, 200, { success: true, message: "Global and managed guild slash commands re-registered." });
      }
      if (pathname === "/api/control/shutdown") {
        sendJson(res, 200, { success: true, message: "Bot process shutting down..." });
        const timer = setTimeout(() => Promise.resolve(shutdown()).catch(error => client.logger.error("[control] Shutdown failed:", error.message)), 500);
        timer.unref();
        return;
      }
      return sendJson(res, 404, { success: false, error: "Not found" });
    } catch (error) {
      client.logger.error("[control] Request failed:", error.message);
      return sendJson(res, 500, { success: false, error: "Control operation failed; check the service logs." });
    }
  };
}
function startControlServer(client) {
  const token = (process.env.APSWIFTLY_CONTROL_TOKEN || "").trim();
  if (!token) return null;
  const host = process.env.APSWIFTLY_CONTROL_HOST || "127.0.0.1";
  const port = Number(process.env.APSWIFTLY_CONTROL_PORT || 3921);
  const server = http.createServer(createControlHandler(client, { token, shutdown: async () => {
    await client.shutdown();
    process.exit(0);
  } }));
  server.requestTimeout = 15_000;
  server.on("error", error => client.logger.error("[control] Server error:", error.message));
  server.listen(port, host, () => client.logger.log(`[control] Listening on ${host}:${port}`));
  return server;
}
module.exports = { authorized, createControlHandler, startControlServer };
