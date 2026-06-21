const { AoiClient } = require("aoi.js"); // Define aoi.js client
const config = require("./config.json"); // Load the setup options from config
require('dotenv').config() // Enable env support in local hosting

const functions = require("./handlers/functions.js");
const vars = require('./handlers/variables.js');

const client = new AoiClient({
  token: process.env.BotToken || config.BotToken, // Token with either env or config
  prefix: "$getGuildVar[prefix]", // By default, it uses custom prefix system (default prefix used: d!).
  intents: ["MessageContent", "Guilds", "GuildMessages", "GuildMembers", "GuildPresences", "GuildMessageReactions", "GuildModeration", "GuildEmojisAndStickers"], 
  events: ["onMessage", "onInteractionCreate", "onJoin", "onLeave", "onMessageDelete", "onMessageUpdate", "onBanAdd", "onBanRemove", "onGuildJoin", "onFunctionError", "onMemberUpdate", "onChannelCreate", "onChannelDelete", "onChannelUpdate", "onRoleUpdate", "onRoleDelete", "onRoleCreate"],
  aoiLogs: false, // Don't show aoi.js default console message
  aoiWarning: false, // Disable aoi.js update warning
  database: { // Use aoi.db as the default database for storing data
    type: "aoi.db",
    db: require("@aoijs/aoi.db"),
    dbType: "KeyValue",
    tables: ["main","custom"], // tables for the database
    path: process.env.AOI_DB_PATH || "./database/",
    securityKey: process.env.DBsecurityKey || config.DBsecurityKey // Security Key with either env or config
  },
  disableFunctions: ["$clientToken"], // For safety reasons
  mobilePlatform: config.MobileStatus, // Whether or not to enable mobile status
  debugs: {
   interpreter: config.EnableDebugMode // Whether or not to enable aoi.js debug mode
  },
  respondOnEdit: {
   commands: config.respondOnEdit,
   time: 20000
  },
  aoiAutoUpdate: false,
  suppressAllErrors: config.DisableAllErrors // Whether or not to disable errors from aoi.js
});


client.loadCommands("./commands/", config.LogCommands);

Object.keys(vars).forEach((t) =>
  client.variables(vars[t], t)
)
functions.forEach((func) => client.functionManager.createFunction(func));

client.status({
    name: "/help | apstudy.org",
    type: "PLAYING",
});

Object.keys(vars).forEach((t) =>
  client.variables(vars[t], t)
)

const axios  = require("axios");
const sharp  = require("sharp");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");

client.functionManager.createFunction({
  name : "$renderMath",
  type : "djs",
  code : async d => {
    const data = d.util.aoiFunc(d);
    if (data.err) return d.error(data.err);
    const [
      expr, 
      inline = "false", 
      scale  = "1.2", 
      pad    = "20"
    ] = data.inside.splits;
    const encoded   = encodeURIComponent(expr.addBrackets());
    const apiParam  = inline.addBrackets() === "true" ? "inline" : "from";
    const svgURL    = `https://math.now.sh?${apiParam}=${encoded}&color=white`;
    const svg       = (await axios.get(svgURL, { responseType: "text" })).data;
    const pngBuf = await sharp(Buffer.from(svg), { density: 3000 * +scale })
      .flatten({ background: { r:49, g:51, b:56, alpha:1 } })
      .extend({
        top:+pad, bottom:+pad, left:+pad, right:+pad,
        background:{ r:49, g:51, b:56, alpha:1 }
      })
      .resize({
  		height: 45,
        kernel: sharp.kernel.lanczos2
      })
      .png()
      .toBuffer();
    const attachment = new AttachmentBuilder(pngBuf, { name: "equation.png" });
    const sent = await d.channel.send({
      content: `**Requested by <@${d.author.id}>**`,
      files: [ attachment ]
    });
    await sent.react(':trash:');
    const filter = (reaction, user) =>
      reaction.emoji.id === '1367302883032301651' &&
      user.id === d.author.id;
    const collector = sent.createReactionCollector({ filter, max: 1, time: 300_000 });
    collector.on('collect', () => sent.delete());
    const url = sent.attachments.first()?.url ?? "Error: No attachment URL.";
    return { code: d.util.setCode(data, url) };
  }
});