"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { Collection, PermissionFlagsBits } = require("discord.js");
const { createBot } = require("../src/client");
const { CheckinService, DAY, GUILD_ID, CATEGORY_ID, STAFF_ROLE_ID } = require("../src/services/checkins");
const { ComponentContext, handleComponent } = require("../src/routers/interactions");
const logger = { log(){},warn(){},error(){},debug(){},child(){return this;} };
function setup(t, filename=":memory:") {
  const client=createBot({connect:false,sqlitePath:filename,logger});
  let now=10*DAY, sequence=0;
  const sent=[], edits=[];
  const guild={id:GUILD_ID};
  const channel={id:"123456789012345678",guild,parentId:CATEGORY_ID,type:0,createdTimestamp:DAY,
    async send(payload) {
      for (const embed of payload.embeds||[]) embed.toJSON();
      for (const row of payload.components||[]) row.toJSON();
      const message={id:String(++sequence),createdTimestamp:now,channel,edit:async p=>edits.push(p),...payload};
      sent.push(message);client.services.checkins.activity(message);return message;
    },
    messages:{fetch:async arg=>typeof arg === "object" ? new Collection(sent.length ? [[sent.at(-1).id,sent.at(-1)]] : []) : {edit:async p=>edits.push(p)}}};
  guild.channels={fetch:async()=>new Collection([[channel.id,channel]])};
  client.channels.fetch=async()=>channel;
  client.guilds.fetch=async()=>guild;
  client.isReady=()=>true;
  const service=new CheckinService(client,{now:()=>now});client.services.checkins=service;
  const scheduler=client.services.scheduler;scheduler.now=()=>now;
  t.after(()=>{service.stop();scheduler.stop();if(client.sqlite.open)client.sqlite.close();});
  const interaction=(record,customId,admin=false,manager=false)=>({
    customId,user:{id:"u"},guild,channel,message:{id:record.schedule_message_id,edit:async payload=>edits.push(payload)},member:{permissions:{has:p=>admin && p === PermissionFlagsBits.Administrator},roles:{cache:new Collection(manager ? [[STAFF_ROLE_ID,{}]] : [])}},
    isButton:()=>true,isAnySelectMenu:()=>false,isModalSubmit:()=>false,
    deferred:false,replied:false,reply:async()=>{},editReply:async()=>{},followUp:async()=>{},
    async deferReply(){this.deferred=true;}
  });
  return {client,service,scheduler,channel,sent,edits,interaction,setNow:n=>now=n,now:()=>now,pings:()=>sent.filter(m=>m.content?.includes("<@&"))};
}
function temp(t) {const dir=fs.mkdtempSync(path.join(os.tmpdir(),"checkin-audit-"));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}

test("real early handlers and timer race produce only one ping",async t=>{
  const f=setup(t), row=await f.service.create(f.channel,DAY);
  const early=f.client.registry.findComponent("button",`earlycheckin:${row.id}`)[0];
  const run=()=>early.execute(new ComponentContext({client:f.client,def:early,interaction:f.interaction(row,`earlycheckin:${row.id}`)}));
  await Promise.all([run(),run(),f.service.deliver(row.id)]);
  assert.equal(f.pings().length,1);assert.equal(f.service.get(row.id).status,"sent");
  await run();assert.equal(f.pings().length,1);
  assert.equal(f.pings()[0].nonce,row.nonce);assert.equal(f.pings()[0].enforceNonce,true);
});
test("old buttons cannot cancel or send a newer timer",async t=>{
  const f=setup(t), old=await f.service.create(f.channel,DAY);
  await f.service.cancel(old.id);
  const current=await f.service.create(f.channel,DAY);
  for(const name of ["earlycheckin","cancelcheckin"]){
    await handleComponent(f.client,f.interaction(old,`${name}:${old.id}`));
    await handleComponent(f.client,f.interaction(old,name)); // existing legacy button shape
  }
  assert.equal(f.service.active(f.channel.id).id,current.id);assert.equal(f.pings().length,0);
});
test("simultaneous creation reserves one timer and one schedule message",async t=>{
  const f=setup(t);const result=await Promise.all([f.service.create(f.channel,DAY),f.service.create(f.channel,DAY)]);
  assert.equal(result.filter(Boolean).length,1);assert.equal(f.sent.length,1);
  assert.equal(f.scheduler.listJobsOfType("checkinTimeout").length,1);
});
test("uncertain Discord success is not resent after restart beyond nonce window",async t=>{
  const file=path.join(temp(t),"state.sqlite"), f=setup(t,file);
  const row=await f.service.create(f.channel,DAY);
  const original=f.channel.send;
  f.channel.send=async payload=>{await original(payload);throw new Error("connection lost after Discord accepted message");};
  await f.service.deliver(row.id);assert.equal(f.pings().length,1);assert.equal(f.service.get(row.id).status,"uncertain");
  f.client.sqlite.close();const restarted=setup(t,file);restarted.setNow(30*DAY);
  await restarted.service.start();await restarted.scheduler.processDue();await restarted.service.deliver(row.id);
  assert.equal(restarted.pings().length,0);assert.equal(restarted.service.active(f.channel.id).status,"uncertain");
  assert.equal(await restarted.service.create(restarted.channel,DAY),null);
  assert.equal(restarted.service.resolve(restarted.channel.id),true);
});
test("crash before send and after accepted send both preserve durable no-replay claim",async t=>{
  for(const stage of ["before","after"]){
    const file=path.join(temp(t),`${stage}.sqlite`),f=setup(t,file),row=await f.service.create(f.channel,DAY);
    f.client.sqlite.prepare("UPDATE checkins SET status='sending' WHERE id=?").run(row.id);
    if(stage === "after") await f.channel.send({content:"<@&already-sent>"});
    f.client.sqlite.close();const next=setup(t,file);next.setNow(20*DAY);
    await next.service.start();await next.scheduler.processDue();await next.service.deliver(row.id);
    assert.equal(next.pings().length,0);assert.equal(next.service.active(next.channel.id).status,"sending");
  }
});
test("message-edit failure cannot repeat a delivered ping",async t=>{
  const f=setup(t),row=await f.service.create(f.channel,DAY);
  f.channel.messages.fetch=async()=>{throw new Error("deleted schedule message");};
  await f.service.deliver(row.id);await f.service.deliver(row.id);
  assert.equal(f.pings().length,1);assert.equal(f.service.get(row.id).status,"sent");
});
test("inactivity starts four-day timer at three-day threshold and keeps it on activity",async t=>{
  const f=setup(t);f.service.activity({channel:f.channel,createdTimestamp:f.now()});
  f.setNow(13*DAY-1);await f.service.scan();assert.equal(f.sent.length,0);
  f.setNow(13*DAY);await f.service.scan();const row=f.service.active(f.channel.id);
  assert.equal(row.origin,"automatic");assert.equal(row.due_at,17*DAY);
  f.service.activity({channel:f.channel,createdTimestamp:14*DAY,author:{bot:true},webhookId:"w"});
  await f.service.scan();assert.equal(f.service.active(f.channel.id).id,row.id);
  f.setNow(17*DAY);await f.scheduler.processDue();assert.equal(f.pings().length,1);
  f.setNow(20*DAY-1);await f.service.scan();assert.equal(f.service.active(f.channel.id),undefined);
  f.setNow(20*DAY);await f.service.scan();assert.equal(f.service.active(f.channel.id).due_at,24*DAY);
});
test("all message types reset clock; unavailable history never creates a timer",async t=>{
  const f=setup(t);f.service.activity({channel:f.channel,createdTimestamp:f.now(),author:{bot:true},content:"",attachments:new Collection([["a",{}]])});
  f.setNow(12*DAY);await f.service.scan();assert.equal(f.sent.length,0);
  f.setNow(14*DAY);f.channel.messages.fetch=async()=>{throw new Error("Missing ReadMessageHistory");};
  await f.service.scan();assert.equal(f.sent.length,0);
});
test("disable button accepts admins, persists, cancels automatic but not manual timers",async t=>{
  const file=path.join(temp(t),"state.sqlite"), f=setup(t,file);
  await f.service.scan();const automatic=f.service.active(f.channel.id);
  await handleComponent(f.client,f.interaction(automatic,`autocheckinoff:${automatic.id}`));
  assert.equal(f.service.state(f.channel.id).disabled,0);
  await handleComponent(f.client,f.interaction(automatic,`autocheckinoff:${automatic.id}`,true));
  assert.equal(f.service.state(f.channel.id).disabled,1);assert.equal(f.service.get(automatic.id).status,"canceled");
  const manual=await f.service.create(f.channel,DAY);
  await f.service.setEnabled(f.channel.id,false);assert.equal(f.service.active(f.channel.id).id,manual.id);
  f.client.sqlite.close();const next=setup(t,file);assert.equal(next.service.state(f.channel.id).disabled,1);
  await next.service.setEnabled(f.channel.id,true);assert.equal(next.service.state(f.channel.id).cooldown_at,next.now());
});
test("managers can disable and enable from the original message without reviving canceled timers",async t=>{
  const f=setup(t);
  await f.service.scan();const automatic=f.service.active(f.channel.id);
  const click=mode=>handleComponent(f.client,f.interaction(automatic,`autocheckin${mode}:${automatic.id}`,false,true));
  await click("off");
  assert.equal(f.service.state(f.channel.id).disabled,1);
  assert.equal(f.scheduler.listJobsOfType("checkinTimeout").length,0);
  let buttons=f.edits.at(-1).components[0].toJSON().components;
  assert.equal(buttons[2].label,"Enable auto check-ins");
  assert.equal(buttons[2].custom_id,`autocheckinon:${automatic.id}`);
  assert.equal(buttons[2].disabled,undefined);
  assert.equal(buttons[0].disabled,true);assert.equal(buttons[1].disabled,true);
  f.setNow(20*DAY);
  await handleComponent(f.client,f.interaction(automatic,`autocheckinon:${automatic.id}`));
  assert.equal(f.service.state(f.channel.id).disabled,1);
  await click("on");
  assert.equal(f.service.state(f.channel.id).disabled,0);
  assert.equal(f.service.state(f.channel.id).cooldown_at,20*DAY);
  assert.equal(f.service.get(automatic.id).status,"canceled");
  buttons=f.edits.at(-1).components[0].toJSON().components;
  assert.equal(buttons[2].label,"Disable auto check-ins");
  assert.equal(buttons[2].custom_id,`autocheckinoff:${automatic.id}`);
  assert.equal(buttons[0].disabled,true);assert.equal(buttons[1].disabled,true);
  f.setNow(23*DAY-1);await f.service.scan();assert.equal(f.service.active(f.channel.id),undefined);
  f.setNow(23*DAY);await f.service.scan();assert.equal(f.service.active(f.channel.id).origin,"automatic");
  assert.equal(f.pings().length,0);
});
test("auto buttons reject mismatched messages, manual timers, and archived channels",async t=>{
  const f=setup(t);await f.service.scan();const automatic=f.service.active(f.channel.id);
  const mismatched=f.interaction(automatic,`autocheckinoff:${automatic.id}`,false,true);
  mismatched.message.id="other";await handleComponent(f.client,mismatched);
  assert.equal(f.service.state(f.channel.id).disabled,0);
  f.channel.parentId="1550896740096548894";
  await handleComponent(f.client,f.interaction(automatic,`autocheckinoff:${automatic.id}`,false,true));
  assert.equal(f.service.state(f.channel.id).disabled,0);
  f.channel.parentId=CATEGORY_ID;await f.service.cancel(automatic.id);
  const manual=await f.service.create(f.channel,DAY);
  await handleComponent(f.client,f.interaction(manual,`autocheckinoff:${manual.id}`,false,true));
  assert.equal(f.service.state(f.channel.id).disabled,0);
  assert.equal(f.service.active(f.channel.id).id,manual.id);
});
test("managers can use prefix auto controls while ordinary members cannot",async t=>{
  const f=setup(t),command=f.client.registry.prefixCommands.get("checkin");
  const ctx={services:f.client.services,channel:f.channel,channelId:f.channel.id,
    member:f.interaction({},"",false,true).member,arg:index=>index === 1 ? "auto" : "off",send:async()=>{}};
  await command.execute(ctx);assert.equal(f.service.state(f.channel.id).disabled,1);
  ctx.arg=index=>index === 1 ? "auto" : "on";
  ctx.member=f.interaction({},"").member;
  await command.execute(ctx);assert.equal(f.service.state(f.channel.id).disabled,1);
  ctx.member=f.interaction({},"",false,true).member;
  await command.execute(ctx);assert.equal(f.service.state(f.channel.id).disabled,0);
});
test("archival cancels a pending check-in without sending",async t=>{
  const f=setup(t),row=await f.service.create(f.channel,DAY);f.channel.parentId="1550896740096548894";
  await f.service.deliver(row.id);assert.equal(f.service.get(row.id).status,"canceled");assert.equal(f.pings().length,0);
});
test("legacy pending job imports once; orphaned message requires review",async t=>{
  const f=setup(t);
  f.client.db.setChannelVar(f.channel.id,"checkinid","legacy-message");f.client.db.setChannelVar(f.channel.id,"checkintimeoutid","legacy-job");
  f.scheduler.addJob({id:"legacy-job",type:"checkinTimeout",executeAt:f.now()+DAY,payload:{channelID:f.channel.id}});
  f.service.reconcileLegacy();f.service.reconcileLegacy();assert.equal(f.service.active(f.channel.id).status,"pending");
  await f.service.deliver("legacy-job","legacy-message");assert.equal(f.pings().length,1);
  f.client.db.setChannelVar("orphan","checkinid","old");f.service.reconcileLegacy();assert.equal(f.service.active("orphan").status,"uncertain");
});
test("two independent Node processes sharing SQLite cannot double-send",async t=>{
  const dir=temp(t),file=path.join(dir,"state.sqlite"),log=path.join(dir,"sends.txt"), f=setup(t,file);
  const row=await f.service.create(f.channel,DAY);
  const script=`const fs=require('node:fs');const {createBot}=require('./src/client');
    const c=createBot({connect:false,sqlitePath:process.argv[1]});
    const channel={id:'${f.channel.id}',guild:{id:'${GUILD_ID}'},parentId:'${CATEGORY_ID}',type:0,
    send:async p=>{fs.appendFileSync(process.argv[2],'ping\\n');await new Promise(r=>setTimeout(r,50));return{id:'sent'};},
    messages:{fetch:async()=>({edit:async()=>{}})}};
    c.channels.fetch=async()=>channel;
    c.services.checkins.deliver(process.argv[3]).then(()=>c.sqlite.close()).catch(e=>{console.error(e);process.exitCode=1});`;
  const run=()=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,["-e",script,file,log,row.id],{cwd:path.join(__dirname,"..")});let errors="";p.stderr.on("data",b=>errors+=b);p.on("error",reject);p.on("close",code=>code ? reject(new Error(errors)) : resolve());});
  await Promise.all([run(),run()]);assert.equal(fs.readFileSync(log,"utf8"),"ping\n");
});
