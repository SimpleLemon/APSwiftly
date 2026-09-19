"use strict";
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const { canUseCommand, category } = require("./commandAccess");
const LABELS = { main:"Main", entertainment:"Entertainment", leveling:"Leveling", util:"Utilities", moderation:"Moderation", apstudy:"APStudy", volunteer:"Volunteer", dev:"Developer" };
function commands(client,ctx,module) {
  return [...client.registry.prefixCommands.values(),...client.registry.slashCommands.values()]
    .filter(def=>category(def) === module && canUseCommand(client,ctx,def))
    .sort((a,b)=>(a.name||a.slash.name).localeCompare(b.name||b.slash.name));
}
function canUseModule(client,ctx,module) { return commands(client,ctx,module).length > 0; }
function buildHelpMenu(client,ctx) {
  return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
    .setCustomId(`helpmenu_${ctx.authorId}`).setPlaceholder("Select a module")
    .addOptions(Object.entries(LABELS).filter(([key])=>canUseModule(client,ctx,key)).map(([value,label])=>({value,label}))));
}
function buildHelpEmbed(client,ctx,module="main") {
  const stored = ctx.guild ? client.db.getGuildVar(ctx.guild.id,"prefix") : null;
  const prefix = stored && stored !== "none" ? String(stored) : client.config.prefix;
  const list=commands(client,ctx,module).map(def=>{
    const aliases=def.aliases ? (Array.isArray(def.aliases) ? def.aliases : [def.aliases]) : [];
    return `\`${def.slash ? "/" : prefix}${def.slash?.name || def.name}\`${aliases.length ? ` (aliases: ${aliases.join(", ")})` : ""}`;
  });
  const embed=new EmbedBuilder().setTitle(`${LABELS[module] || "Commands"} — APSwiftly`).setColor(client.db.getVar("embedcolor"))
    .setDescription(`Commands available to you here. Prefix: \`${prefix}\`. Use \`${prefix}commandinfo <name>\` for details.`);
  let text="", page=1;
  for (const line of list) {
    if (text.length+line.length+1>1000) { embed.addFields({name:`Commands ${page++}`,value:text}); text=""; }
    text+=(text ? "\n" : "")+line;
  }
  if (text) embed.addFields({name:page === 1 ? "Commands" : `Commands ${page}`,value:text});
  return embed;
}
module.exports={buildHelpMenu,buildHelpEmbed,canUseModule,
 userAppsEnabled:client=>[true,"true"].includes(client.db.getVar("userapps")),
 setupComplete:client=>[true,"true","yes"].includes(client.db.getVar("isuserappsalreadysetup"))};
