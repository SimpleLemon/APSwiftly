# Migration repair verification and cutover

## Local evidence

The migration initially passed 58 tests despite reproducible check-in and interaction defects. New regression suites execute real check-in handlers, two independent Node processes sharing SQLite, uncertain-send/restart recovery, legacy conversion, inactivity boundaries, permission checks, logging, slash payload validation, help coverage and reload.

Check-in delivery is **at-most-once application dispatch**, not guaranteed delivery. SQLite and Discord cannot commit one transaction together. A durable send claim prevents replay after a crash; a stable enforced nonce adds protection against immediate transport duplication. An uncertain send remains blocked for staff review. Inspect the channel, run `checkin status`, then `checkin resolve` to acknowledge the outcome without another ping. After a crash, creating/sending records require a five-minute wait before resolution. Never reset these records directly to pending.

Validation always uses an in-memory database and does not connect to Discord, register commands, or execute timers. Production snapshots are read-only inputs to tests, with imported databases created under temporary directories. Local snapshot comparisons cover 174 values but no real pending production timers; synthetic fixtures cover timer migration.

Verified on macOS with Node 25.9.0 and on the production Linux/Node 20.20.2 runtime: 89/89 tests passed, including the final production snapshot. Offline validation loaded 91 prefix commands, 82 aliases, 20 slash handlers, 140 components, 15 events and two job handlers with no registry errors. SQLite uses WAL with synchronous=FULL to persist the send claim before the network request.

## Production cutover evidence — September 19, 2026

- Production tracks `codex/discordjs-migration-checkin-reliability`. The old process was stopped before taking the final source snapshot; only the new bot runs. Nest remained active throughout the cutover.
- All 174 records (66 main, 108 custom) were imported and archived with per-value verification and SQLite integrity checks. Source checksum: `60e8e2d11831e6f97d17ffa0c29317b8aff94addbf991f96c3cf9db59459686d`. The source contained no persisted timeout jobs. Volunteer-hour values match the original archive.
- Root-only backup directory: `/var/backups/apswiftly/discordjs-cutover-20260919/`. It contains `legacy-deployment/`, `aoi-database/`, configuration, the old systemd unit, `migration-report.json`, a pre-restart check-in snapshot, and `verified-post-cutover.sqlite`.
- Authenticated control status returns HTTP 200 with Discord ready. The systemd service remains active with no automatic restarts after the final code update.
- Discord registrations match the definitions: 18 global slash commands, two guild commands (`addhours`, `noreply`), and the pre-existing Activity entry point. Obsolete global `/addhours` was removed. The live application exposed API error 50240 until synchronization was updated to preserve its Activity entry point; a regression test now covers this. See [Discord application-command documentation](https://docs.discord.com/developers/docs/interactions/slash-commands).
- All 19 contributor text channels were readable and had the required messaging/history/embed permissions. Startup created 11 automatic timers for eligible idle channels. A controlled service restart preserved every timer ID, scheduling-message ID and due time, without creating additional timers. Live Discord history matched database message IDs with no duplicate check-ins.
- People interacted with timers during verification: one was sent early and others were canceled, including an administrator opt-out. These transitions were preserved, including opt-out state. A canceled scheduling message was deleted in Discord; the canceled database record remains.
- Four orphaned legacy message references were quarantined without replay: three deleted channels and one already archived channel. No current contributor channel is blocked by them.

These checks establish deployment health and the observed restart behavior. They do not constitute a live test of every command or an absolute guarantee of external Discord delivery; the controlled checks below remain useful for future releases.

## Before production cutover

1. Select a maintenance window; stop the legacy aoi.js process and any duplicate bot runners. Never run both runtimes against the same Discord application.
2. Take a consistent final backup of the source database and configuration. Keep the original source unchanged and retain the old deployment for rollback.
3. On the intended runtime, install dependencies and run `npm test` and `npm run validate`. Verify privileged intents, `BOT_OWNER_IDS`, `SQLITE_PATH`, guild, role/category IDs, and bot permissions. Archive category is `1550896740096548894`.
4. Run migration with an explicit source and a NEW destination. Inspect the report, counts, checksum and timeout list. The CLI refuses existing destinations unless explicitly given `--allow-existing`; do not overwrite a live database. Unknown active timer types must be reconciled deliberately.
5. Verify the new runtime's database path points at that verified database. Start a single bot process. Startup automatically synchronizes changed slash definitions and begins due jobs only after Discord is ready. Inactivity automation is enabled by default for contributor text channels: initially idle channels may immediately receive scheduling messages, with pings four days later.
6. Inspect `journalctl -u apswiftly`. Use `checkin status` for unresolved imported timers. Confirm no duplicate processes. Database state must remain durable across deployments.

## Controlled Discord smoke test

Use a designated contributor test channel and test users/roles. Live testing requires a separately agreed environment; hard-coded production IDs must not be replaced just to run tests.

- Verify `=help`, `/help`, `=commandinfo /addhours`, public server slash visibility, staff `/addhours` visibility, owner-only commands, and normal-user denial.
- Schedule a short manual check-in, restart before it is due, and verify one ping. Rapidly click early/cancel; old messages must not affect a new timer. Verify the timer's role mention and message updates.
- Review inactivity scheduling in a controlled idle channel. Any new message counts as activity. Test the gray disable button as a normal user and an administrator; confirm persistent opt-out after restart. `checkin auto on` restarts the three-day waiting period.
- Move/archive the test channel: confirm category `1550896740096548894` and no outstanding pending ping.
- Test settings dropdowns, welcome/leave templates and modals, message-log toggles, leveling, games, and API-based commands. Verify `/latex`, `/ai`, user-installed command contexts, closed DMs and slow network failures.
- Verify edited/revoked permissions are enforced on existing controls and that slash sync has removed stale managed registrations.

API providers, Discord credentials/permissions, actual slash visibility, role hierarchy and production behavior cannot be established by mocked local tests alone. Record live smoke-test outcomes before claiming production readiness.

## Rollback

Stop the new process first. Preserve its SQLite database and review any delivered check-ins/hours before reverting: the legacy snapshot will not contain writes made after cutover. Do not restart legacy pending timers blindly; they may repeat reminders already sent by the new runtime. Reconcile pending timers and post-cutover data deliberately before enabling another runner.
