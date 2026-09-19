"use strict";
const { test }=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const { execFileSync }=require("node:child_process");
const { Collection, PermissionFlagsBits: P }=require("discord.js");
const { createBot }=require("../src/client");
const { ComponentContext, handleComponent, handleSlash }=require("../src/routers/interactions");
const { buildHelpEmbed, buildHelpMenu }=require("../src/services/helpMenu");
const { canUseCommand,category }=require("../src/services/commandAccess");
const { SLASH_DEFINITIONS }=require("../src/slash/definitions");
const { GUILD_ID,CATEGORY_ID,STAFF_ROLE_ID }=require("../src/services/checkins");
const quiet={log(){},error(){},warn(){},debug(){},child(){return this;}};
function fixture(t){
 const c=createBot({connect:false,sqlitePath:':memory:',logger:quiet});c.user={id:'bot'};
 t.after(()=>{c.services.scheduler.stop();c.services.checkins.stop();if(c.sqlite.open)c.sqlite.close();});
 const sent=[];const channel={id:'channel',name:'general',parentId:CATEGORY_ID,type:0,isTextBased:()=>true,permissionsFor:()=>({has:()=>true}),send:async p=>{p.embeds?.forEach(e=>e.toJSON());sent.push(p);return{id:'sent'};}};
 const guild={id:GUILD_ID,channels:{cache:new Collection([['channel',channel]])},members:{me:{}}};channel.guild=guild;
 const member={id:'owner',permissions:{has:()=>true},roles:{cache:new Collection([[STAFF_ROLE_ID,{}],['1319501912638226543',{}]])}};
 const i={customId:'settingsmenu_owner',values:['autoreply'],user:{id:'owner'},member,guild,channel,message:{},deferred:false,replied:false,
 isButton:()=>false,isAnySelectMenu:()=>true,isModalSubmit:()=>false,
 async reply(p){this.replied=true;sent.push(p);},async update(p){this.replied=true;p.embeds?.forEach(e=>e.toJSON());sent.push(p);},
 async deferReply(){this.deferred=true;},async editReply(p){this.replied=true;sent.push(p);},async followUp(p){sent.push(p);}};
 return {c,sent,channel,guild,member,i};
}
test('real settings dropdown and toggle work; revoked permission is rejected',async t=>{
 const {c,i,sent,guild}=fixture(t);
 await handleComponent(c,i);assert.equal(sent[0].embeds[0].toJSON().title,'Auto Reply');
 i.customId='autoreplytoggle_owner';i.isButton=()=>true;i.replied=false;
 await handleComponent(c,i);assert.equal(c.db.getGuildVar(guild.id,'autopingreply'),'on');
 i.member.permissions.has=()=>false;i.replied=false;
 await handleComponent(c,i);assert.equal(c.db.getGuildVar(guild.id,'autopingreply'),'on');assert.match(sent.at(-1).content,/permission/);
});
test('message-log toggles and bot toggle are independent; combined long text becomes attachment',async t=>{
 const {c,channel,guild,sent}=fixture(t);c.db.setGuildVar(guild.id,'msgeventschannel',channel.id);
 const [deleted,edited]=require('../commands/Automation/Events/message-logs');
 const m={id:'message',guild,channel,channelId:channel.id,author:{id:'u',username:'User'},content:'hello',attachments:new Collection(),embeds:[]};
 c.db.setGuildVar(guild.id,'msgdeletelog','off');await deleted.execute({client:c,message:m});assert.equal(sent.length,0);
 c.db.setGuildVar(guild.id,'msgeditlog','on');await edited.execute({client:c,oldMessage:{...m,content:'before'},newMessage:m});assert.equal(sent.length,1);
 c.db.setGuildVar(guild.id,'msgdeletelog','on');c.db.setGuildVar(guild.id,'msgeditlog','off');await edited.execute({client:c,oldMessage:{...m,content:'before'},newMessage:m});assert.equal(sent.length,1);
 c.db.setGuildVar(guild.id,'includebots','off');await deleted.execute({client:c,message:{...m,author:{...m.author,bot:true}}});assert.equal(sent.length,1);
 c.db.setGuildVar(guild.id,'msgeditlog','on');await edited.execute({client:c,oldMessage:{...m,content:'a'.repeat(2100)},newMessage:{...m,content:'b'.repeat(2100)}});assert.ok(sent.at(-1).files);
});
test('slash registration validates payloads and makes public commands server-visible',t=>{
 const {c}=fixture(t);assert.doesNotThrow(()=>c.services.slash.validate());
 for(const name of ['ping','avatar','banner','invite','reverse','owoify','8ball'])assert.deepEqual(SLASH_DEFINITIONS[name].integration_types,[0,1]);
 assert.equal(SLASH_DEFINITIONS.addhours.guildId,GUILD_ID);assert.equal(SLASH_DEFINITIONS.addhours.default_member_permissions,undefined);
 const option=SLASH_DEFINITIONS.ban.options.at(-1);option.autocomplete=true;
 try {assert.throws(()=>c.services.slash.validate(),/Conflicting/);}finally{delete option.autocomplete;}
});
test('definition hash sync runs once and covers both scopes',async t=>{
 const {c}=fixture(t);let calls=0;c.services.slash.syncAll=async()=>{calls++;};
 await c.services.slash.syncIfChanged();await c.services.slash.syncIfChanged();assert.equal(calls,1);
 const previous=SLASH_DEFINITIONS.noreply.guildId;SLASH_DEFINITIONS.noreply.guildId='other';
 try{await c.services.slash.syncIfChanged();assert.equal(calls,2);}finally{SLASH_DEFINITIONS.noreply.guildId=previous;}
});
test('help includes every available registered command and uses actual prefix',t=>{
 const {c,i}=fixture(t);c.ownerIds=['owner'];c.db.setGuildVar(GUILD_ID,'prefix','=');
 const ctx=new ComponentContext({client:c,interaction:i,def:{}});
 const menus=buildHelpMenu(c,ctx).toJSON().components[0].options;
 const rendered=menus.map(m=>JSON.stringify(buildHelpEmbed(c,ctx,m.value).toJSON())).join('\n');
 for(const def of [...c.registry.prefixCommands.values(),...c.registry.slashCommands.values()]){
  if(canUseCommand(c,ctx,def))assert.ok(rendered.includes(`${def.slash ? '/' : '='}${def.slash?.name||def.name}`),def.name||def.slash.name);
 }
 i.member.permissions.has=()=>false;i.member.roles.cache.clear();c.ownerIds=[];
 assert.equal(canUseCommand(c,ctx,c.registry.resolvePrefix('archive')),false);
 assert.ok(!JSON.stringify(buildHelpEmbed(c,ctx,'dev').toJSON()).includes('=eval'));
});
test('slow slash operation defers first and completes original response',async t=>{
 const {c,i,sent}=fixture(t);i.commandName='latex';i.options={getString:()=> 'x^2'};
 c.services.renderMath=async()=>{assert.equal(i.deferred,true);};
 await handleSlash(c,i);assert.equal(i.replied,true);assert.equal(sent.at(-1).content,'Sent your LaTeX message!');
});
test('staff can run /addhours while ordinary users are rejected',async t=>{
 const {c,i}=fixture(t);i.member.permissions.has=()=>false;
 const ctx=new ComponentContext({client:c,interaction:i,def:{}}),def=c.registry.slashCommands.get('addhours');
 assert.equal(canUseCommand(c,ctx,def),true);i.member.roles.cache.clear();assert.equal(canUseCommand(c,ctx,def),false);
});
test('hot reload replaces event/job handlers without duplicates and retains good registry on errors',t=>{
 const {c}=fixture(t),{reloadCommands}=require('../src/services/reload');const oldRegistry=c.registry;
 const oldEvent=c.listeners('messageDelete')[0],oldJob=c.services.scheduler.handlers.get('checkinTimeout');
 reloadCommands(c);assert.notEqual(c.registry,oldRegistry);assert.equal(c.listenerCount('messageDelete'),1);
 assert.notEqual(c.listeners('messageDelete')[0],oldEvent);assert.notEqual(c.services.scheduler.handlers.get('checkinTimeout'),oldJob);
 const good=c.registry,original=c.services.slash.validate;c.services.slash.validate=()=>{throw new Error('broken');};
 assert.throws(()=>reloadCommands(c),/broken/);assert.equal(c.registry,good);c.services.slash.validate=original;
});
test('offline validation ignores configured database and never dispatches jobs',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'validate-audit-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'must-not-create.sqlite');
 execFileSync(process.execPath,['index.js','--validate'],{cwd:path.join(__dirname,'..'),env:{...process.env,SQLITE_PATH:file},stdio:'pipe'});assert.equal(fs.existsSync(file),false);
});
test('archive moves to requested category and cancels pending checkin',async t=>{
 const {c,i,channel,sent}=fixture(t),{Context}=require('../src/context');let destination,canceled;
 channel.setParent=async id=>{destination=id;};c.services.checkins.cancelChannel=async id=>{canceled=id;};
 const def=c.registry.resolvePrefix('archive');const ctx=new Context({client:c,command:def,args:[],message:{guild:i.guild,channel,member:i.member,author:i.user}});
 await def.execute(ctx);assert.equal(destination,'1550896740096548894');assert.equal(canceled,channel.id);
});
test('actual leveling handler advances level even with announcements disabled',async t=>{
 const {c,guild,channel}=fixture(t);c.db.setGuildVar(guild.id,'levelsystem','on');c.db.setGuildVar(guild.id,'levelmessagefeature','off');c.db.setUserVar(guild.id,'u','xp','9');
 await require('../commands/Automation/Others/Systems/levelup').execute({client:c,services:c.services,db:c.db,message:{guild,channel,channelId:channel.id,author:{id:'u'}}});
 assert.equal(c.db.getUserVar(guild.id,'u','level'),'2');assert.equal(c.db.getUserVar(guild.id,'u','xpLimit'),'30');
});

test('managed guild sync sends an empty list to remove obsolete registrations',async t=>{
 const {c}=fixture(t);const calls=[];
 c.sqlite.prepare("INSERT INTO meta(k,v) VALUES ('slash_managed_guilds',?)").run(JSON.stringify(['formerly-managed']));
 c.rest={get:async()=>({id:'application'}),put:async(route,{body})=>{calls.push({route,body});}};
 await c.services.slash.syncAll();
 const old=calls.find(call=>call.route.includes('formerly-managed'));
 assert.deepEqual(old.body,[]);
});
