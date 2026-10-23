"use strict";
const { PermissionFlagsBits } = require("discord.js");
const { parseTime } = require("../../src/utils/time");
const { STAFF_ROLE_ID } = require("../../src/services/checkins");
const staff = ctx => Boolean(ctx.member?.permissions?.has(PermissionFlagsBits.Administrator) || ctx.member?.roles?.cache?.has(STAFF_ROLE_ID));
function recordFor(ctx) {
  const service=ctx.services.checkins;
  const id=ctx.customId.split(":")[1];
  const record=id ? service.get(id) : service.active(ctx.channelId);
  return record?.channel_id === ctx.channelId && record.schedule_message_id === ctx.message?.id ? record : null;
}
async function setAutomatic(ctx, enabled) {
  if (!staff(ctx)) return ctx.reply(`You need Administrator or <@&${STAFF_ROLE_ID}> to manage check-ins.`,{flags:64});
  const service=ctx.services.checkins;
  const row=recordFor(ctx);
  if (!row || row.origin !== "automatic" || !service.eligible(ctx.channel)) return ctx.reply("This button does not belong to this channel's automatic check-in.",{flags:64});
  await ctx.defer({flags:64});
  await service.setEnabled(ctx.channelId,enabled);
  const current=service.get(row.id);
  await ctx.message.edit({components:[service.row(current,current.status !== "pending")]});
  return ctx.reply(enabled ? "Automatic check-ins enabled; a fresh three-day waiting period starts now." : "Automatic check-ins disabled for this channel. Any unsent automatic timer was canceled.");
}
module.exports = [
  { name: "checkin", info: { description: "Schedule a check-in; use status, resolve, or auto on/off.", perms: ["Administrator or APStudy staff"] },
    async execute(ctx) {
      const service=ctx.services.checkins;
      if (!service.eligible(ctx.channel)) return ctx.send("Check-ins are only available in contributor text channels.");
      if (!staff(ctx)) return ctx.send(`You need Administrator or <@&${STAFF_ROLE_ID}> to manage check-ins.`);
      const action=ctx.arg(1)?.toLowerCase();
      if (action === "status") {
        const row=service.active(ctx.channelId), state=service.state(ctx.channelId);
        return ctx.send(`Automatic check-ins: **${state.disabled ? "disabled" : "enabled"}**.\n${row ? `Current check-in: **${row.status}** (${row.origin}), due <t:${Math.floor(row.due_at/1000)}:R>.${row.last_error ? `\nDetails: ${row.last_error}` : ""}${["sending","creating","uncertain"].includes(row.status) ? "\nIf interrupted, staff must inspect the channel before using `checkin resolve`; no automatic resend occurs." : ""}` : "No active check-in."}`);
      }
      if (action === "resolve") return ctx.send(service.resolve(ctx.channelId) ? "Review recorded; no reminder was resent. Automatic scheduling can resume after three days." : "No uncertain check-in is ready to resolve. In-progress operations require a five-minute waiting period.");
      if (action === "auto") {
        const mode=ctx.arg(2)?.toLowerCase();
        if (!["on","off"].includes(mode)) return ctx.send("Usage: checkin auto on/off");
        await service.setEnabled(ctx.channelId,mode === "on");
        return ctx.send(mode === "on" ? "Automatic check-ins enabled; a fresh three-day waiting period starts now." : "Automatic check-ins disabled. Any unsent automatic timer was canceled; manual timers are unchanged.");
      }
      try {
        const row=await service.create(ctx.channel,parseTime(ctx.rawArgs));
        if (!row) return ctx.send("A check-in is already active or awaiting review. Use checkin status.");
      } catch (error) { return ctx.send(error.message); }
    }
  },
  { job: "checkinTimeout", execute: (payload,job,client)=>client.services.checkins.deliver(job.id) },
  { component: "button", customId: "earlycheckin", async execute(ctx) {
    const row=recordFor(ctx);
    if (!row) return ctx.reply("This check-in is no longer active.",{flags:64});
    await ctx.defer({flags:64});
    const sent=await ctx.services.checkins.deliver(row.id,ctx.message.id);
    return ctx.reply(sent ? "Check-in sent early." : "This check-in was already handled or requires staff review.");
  } },
  { component: "button", customId: "cancelcheckin", async execute(ctx) {
    const row=recordFor(ctx);
    if (!row) return ctx.reply("This check-in is no longer active.",{flags:64});
    await ctx.defer({flags:64});
    const canceled=await ctx.services.checkins.cancel(row.id,ctx.message.id);
    return ctx.reply(canceled ? "Check-in canceled." : "This check-in was already handled or delivery has started.");
  } },
  { component: "button", customId: "autocheckinoff", execute: ctx=>setAutomatic(ctx,false) },
  { component: "button", customId: "autocheckinon", execute: ctx=>setAutomatic(ctx,true) }
];
