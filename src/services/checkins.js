"use strict";
const { randomUUID, createHash } = require("node:crypto");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require("discord.js");
const GUILD_ID = "859910344393883710";
const CATEGORY_ID = "1356279309169328158";
const STAFF_ROLE_ID = "1519016533005832332";
const PING_ROLE_ID = "1258652618482389014";
const DAY = 86400000;
const ACTIVE = "('creating','pending','sending','uncertain')";

class CheckinService {
  constructor(client, { now = () => Date.now() } = {}) {
    this.client = client;
    this.sql = client.sqlite;
    this.now = now;
    this.scanning = false;
  }
  eligible(channel) { return channel?.guild?.id === GUILD_ID && channel.parentId === CATEGORY_ID && channel.type === ChannelType.GuildText; }
  get(id) { return this.sql.prepare("SELECT * FROM checkins WHERE id=?").get(String(id)); }
  active(channelId) { return this.sql.prepare(`SELECT * FROM checkins WHERE channel_id=? AND status IN ${ACTIVE}`).get(channelId); }
  state(channelId) {
    this.sql.prepare("INSERT OR IGNORE INTO checkin_channels(channel_id) VALUES (?)").run(channelId);
    return this.sql.prepare("SELECT * FROM checkin_channels WHERE channel_id=?").get(channelId);
  }
  activity(message) {
    if (!this.eligible(message.channel)) return;
    this.state(message.channel.id);
    this.sql.prepare("UPDATE checkin_channels SET last_activity_at=MAX(last_activity_at,?) WHERE channel_id=?")
      .run(message.createdTimestamp ?? this.now(), message.channel.id);
  }
  touch(channelId) {
    this.state(channelId);
    this.sql.prepare("UPDATE checkin_channels SET cooldown_at=? WHERE channel_id=?").run(this.now(), channelId);
  }
  row(record, finished = false) {
    const row = new ActionRowBuilder();
    row.addComponents(
      new ButtonBuilder().setCustomId(`earlycheckin:${record.id}`).setLabel("Early Check-In").setEmoji("🔔").setStyle(ButtonStyle.Primary).setDisabled(finished),
      new ButtonBuilder().setCustomId(`cancelcheckin:${record.id}`).setLabel("Cancel").setStyle(ButtonStyle.Secondary).setDisabled(finished)
    );
    if (record.origin === "automatic") {
      const disabled = Boolean(this.state(record.channel_id).disabled);
      row.addComponents(new ButtonBuilder()
        .setCustomId(`${disabled ? "autocheckinon" : "autocheckinoff"}:${record.id}`)
        .setLabel(`${disabled ? "Enable" : "Disable"} auto check-ins`).setStyle(ButtonStyle.Secondary));
    }
    return row;
  }
  async edit(record, title, description = "") {
    if (!record.schedule_message_id) return;
    try {
      const channel = await this.client.channels.fetch(record.channel_id);
      const message = await channel.messages.fetch(record.schedule_message_id);
      await message.edit({ embeds: [new EmbedBuilder().setTitle(title).setColor("Grey").setDescription(description || "This check-in is no longer active.")], components: [this.row(record, true)] });
    } catch (error) { this.client.logger.warn?.("[checkin] Could not update scheduling message:", error.message); }
  }
  mirror(record) {
    const pending = ["creating", "pending", "sending", "uncertain"].includes(record.status);
    this.client.db.setChannelVar(record.channel_id, "checkinid", pending ? record.schedule_message_id || record.id : "");
    this.client.db.setChannelVar(record.channel_id, "checkintimeoutid", pending ? record.id : "");
  }
  async create(channel, duration, origin = "manual") {
    if (!this.eligible(channel)) throw new Error("Check-ins are only available in contributor text channels.");
    if (!Number.isFinite(duration) || duration <= 0 || duration > 21*DAY) throw new Error("Use a positive duration of at most 21 days.");
    const id = randomUUID();
    const reserved = this.sql.transaction(() => {
      if (this.active(channel.id)) return false;
      const state = this.state(channel.id);
      if (origin === "automatic" && (state.disabled || this.now()-Math.max(state.last_activity_at,state.cooldown_at) < 3*DAY)) return false;
      this.sql.prepare(`INSERT INTO checkins(id,channel_id,guild_id,origin,status,due_at,nonce,created_at,updated_at)
        VALUES (?,?,?,?,'creating',?,?,?,?)`).run(id, channel.id, channel.guild.id, origin, this.now()+duration,
        createHash("sha256").update(id).digest("hex").slice(0,24), this.now(), this.now());
      this.mirror(this.get(id));
      return true;
    }).immediate();
    if (!reserved) return null;
    const record = this.get(id);
    try {
      const sent = await channel.send({
        embeds: [new EmbedBuilder().setTitle(origin === "automatic" ? "Automatic Check-In Scheduled" : "Check-In Scheduled")
          .setDescription(`${origin === "automatic" ? "This channel has been inactive for three days.\n" : ""}Check-in due <t:${Math.floor(record.due_at/1000)}:R>.\nSend it early with 🔔 or cancel with the button below.`).setColor("Green")],
        components: [this.row(record)], nonce: `s${record.nonce}`, enforceNonce: true,
        allowedMentions: { parse: [] }
      });
      this.sql.transaction(() => {
        const changed = this.sql.prepare("UPDATE checkins SET status='pending',schedule_message_id=?,updated_at=? WHERE id=? AND status='creating'")
          .run(sent.id, this.now(), id).changes;
        if (!changed) return;
        this.client.services.scheduler.addJob({ id, type: "checkinTimeout", executeAt: record.due_at, payload: { channelID: channel.id }, dedupeKey: `checkin:${id}` });
        this.mirror(this.get(id));
      }).immediate();
      if (this.get(id).status !== "pending") await sent.edit({ components: [this.row(record, true)] });
      return this.get(id);
    } catch (error) {
      // A failed response can mean Discord accepted the scheduling message.
      this.markUncertain(id, error);
      throw error;
    }
  }
  markUncertain(id, error) {
    const changed = this.sql.prepare("UPDATE checkins SET status='uncertain',last_error=?,updated_at=? WHERE id=? AND status IN ('creating','sending')")
      .run(String(error?.message || error).slice(0,1500), this.now(), id).changes;
    if (changed) this.client.logger.error?.(`[checkin] ${id} requires staff review; no automatic retry:`, error.message || error);
  }
  async deliver(id, messageId = null) {
    let record = this.get(id);
    if (!record || record.status !== "pending" || (messageId && messageId !== record.schedule_message_id)) return false;
    // Fetch and eligibility checks happen before the durable send claim.
    let channel;
    try { channel = await this.client.channels.fetch(record.channel_id); }
    catch (error) {
      if (error.code === 10003) { await this.cancel(id); return false; }
      throw error;
    }
    if (!this.eligible(channel)) { await this.cancel(id); return false; }
    const claimed = this.sql.transaction(() => {
      const changed = this.sql.prepare("UPDATE checkins SET status='sending',updated_at=? WHERE id=? AND status='pending'").run(this.now(),id).changes;
      if (changed) this.client.services.scheduler.cancelJob(id);
      return changed;
    }).immediate();
    if (!claimed) return false;
    try {
      const sent = await channel.send({ content: `<@&${PING_ROLE_ID}>`,
        embeds: [new EmbedBuilder().setTitle("This is the Scheduled Check-In").setColor("Green")
          .setDescription("How are your notes going?\nDo you have any questions for the APStudy representatives?")],
        allowedMentions: { roles: [PING_ROLE_ID], parse: [] }, nonce: record.nonce, enforceNonce: true });
      this.sql.transaction(() => {
        this.sql.prepare("UPDATE checkins SET status='sent',sent_message_id=?,updated_at=? WHERE id=? AND status='sending'")
          .run(sent.id,this.now(),id);
        this.touch(record.channel_id); this.mirror(this.get(id));
      }).immediate();
    } catch (error) {
      this.markUncertain(id,error);
      await this.edit(record,"Check-In Needs Review","Delivery could not be confirmed. Staff can use `checkin status` and `checkin resolve`. It will not be sent again automatically.");
      return false;
    }
    await this.edit(record, "Check-In Sent");
    return true;
  }
  async cancel(id, messageId = null) {
    const record = this.get(id);
    if (!record || (messageId && record.schedule_message_id !== messageId)) return false;
    const changed = this.sql.transaction(() => {
      const count = this.sql.prepare("UPDATE checkins SET status='canceled',updated_at=? WHERE id=? AND status IN ('creating','pending')").run(this.now(),id).changes;
      if (count) { this.client.services.scheduler.cancelJob(id); this.touch(record.channel_id); this.mirror(this.get(id)); }
      return count;
    }).immediate();
    if (changed) await this.edit(record,"Check-In Canceled");
    return Boolean(changed);
  }
  async cancelChannel(channelId) { const active = this.active(channelId); if (active) return this.cancel(active.id); return false; }
  resolve(channelId) {
    const row = this.active(channelId);
    if (!row || !["uncertain","sending","creating"].includes(row.status)) return false;
    // A live operation must not be resolved while it could still finish.
    if (row.status !== "uncertain" && this.now()-row.updated_at < 5*60_000) return false;
    this.sql.transaction(() => {
      this.sql.prepare("UPDATE checkins SET status='resolved',updated_at=? WHERE id=?").run(this.now(),row.id);
      this.client.services.scheduler.cancelJob(row.id); this.touch(channelId); this.mirror(this.get(row.id));
    }).immediate();
    return true;
  }
  async setEnabled(channelId, enabled) {
    this.state(channelId);
    this.sql.prepare("UPDATE checkin_channels SET disabled=?,cooldown_at=? WHERE channel_id=?").run(enabled ? 0 : 1,this.now(),channelId);
    const current = this.active(channelId);
    if (!enabled && current?.origin === "automatic") await this.cancel(current.id);
  }
  reconcileLegacy() {
    const jobs = this.client.services.scheduler.listJobsOfType("checkinTimeout");
    this.sql.transaction(() => {
      for (const job of jobs) {
        if (this.get(job.id)) continue;
        const channelId = job.payload.channelID;
        if (!channelId) { this.client.services.scheduler.cancelJob(job.id); continue; }
        const activeId = this.client.db.getChannelVar(channelId,"checkintimeoutid");
        const messageId = this.client.db.getChannelVar(channelId,"checkinid");
        if (String(activeId) !== job.id || this.active(channelId)) { this.client.services.scheduler.cancelJob(job.id); continue; }
        this.sql.prepare(`INSERT INTO checkins(id,channel_id,guild_id,origin,status,due_at,schedule_message_id,nonce,created_at,updated_at,last_error)
          VALUES (?,?,?,'manual',?,?,?,?,?,?,?)`).run(job.id,channelId,GUILD_ID,
          messageId && job.status !== "running" ? "pending" : "uncertain",job.executeAt,messageId || null,
          createHash("sha256").update(job.id).digest("hex").slice(0,24),this.now(),this.now(),job.status === "running" ? "Legacy delivery may have started" : null);
      }
      for (const entry of this.client.db.rawList("custom","checkinid_")) {
        if (!entry.value) continue;
        const channelId = entry.key.slice("checkinid_".length);
        if (this.active(channelId)) continue;
        const id=randomUUID();
        this.sql.prepare(`INSERT INTO checkins(id,channel_id,guild_id,origin,status,due_at,schedule_message_id,nonce,created_at,updated_at,last_error)
          VALUES (?,?,?,'manual','uncertain',?,?,?,?,?,'Legacy message has no matching timer')`)
          .run(id,channelId,GUILD_ID,this.now(),String(entry.value),id.replaceAll("-","").slice(0,24),this.now(),this.now());
      }
    }).immediate();
  }
  async scan() {
    if (this.scanning || !this.client.isReady()) return;
    this.scanning = true;
    try {
      const guild = await this.client.guilds.fetch(GUILD_ID);
      const channels = await guild.channels.fetch();
      for (const channel of channels.values()) {
        if (!this.eligible(channel)) continue;
        try {
          const messages = await channel.messages.fetch({ limit: 1 });
          const latest = messages.first();
          this.activity({ channel, createdTimestamp: latest?.createdTimestamp ?? channel.createdTimestamp });
          const active = this.active(channel.id);
          if (active) continue;
          await this.create(channel,4*DAY,"automatic");
        } catch (error) { this.client.logger.warn?.(`[checkin] Skipping ${channel.id}:`,error.message); }
      }
      for (const record of this.sql.prepare("SELECT * FROM checkins WHERE status='pending'").all()) {
        const channel = channels.get(record.channel_id);
        if (!channel || !this.eligible(channel)) await this.cancel(record.id);
      }
    } catch (error) { this.client.logger.warn?.("[checkin] Inactivity scan failed:",error.message); }
    finally { this.scanning = false; }
  }
  async start() {
    this.reconcileLegacy();
    for (const row of this.sql.prepare("SELECT id,channel_id,status FROM checkins WHERE status IN ('creating','sending','uncertain')").all()) {
      this.client.logger.warn?.(`[checkin] ${row.channel_id}: ${row.id} is ${row.status}; inspect with checkin status before resolving. No replay will occur.`);
    }
    // Persisted 'sending'/'creating' records remain blocked, including if another
    // process owns them. Status exposes them without blindly retrying.
    await this.scan();
    if (!this.timer) { this.timer=setInterval(()=>this.scan(),15*60_000); this.timer.unref(); }
  }
  stop() { clearInterval(this.timer); this.timer=null; }
}
module.exports = { CheckinService, GUILD_ID, CATEGORY_ID, STAFF_ROLE_ID, DAY };
