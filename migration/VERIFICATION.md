# Migration repair verification and cutover

## Local evidence

The migration initially passed 58 tests despite reproducible check-in and interaction defects. New regression suites execute real check-in handlers, two independent Node processes sharing SQLite, uncertain-send/restart recovery, legacy conversion, inactivity boundaries, permission checks, logging, slash payload validation, help coverage and reload.

Check-in delivery is **at-most-once application dispatch**, not guaranteed delivery. SQLite and Discord cannot commit one transaction together. A durable send claim prevents replay after a crash; a stable enforced nonce adds protection against immediate transport duplication. An uncertain send remains blocked for staff review. Inspect the channel, run `checkin status`, then `checkin resolve` to acknowledge the outcome without another ping. After a crash, creating/sending records require a five-minute wait before resolution. Never reset these records directly to pending.

Validation always uses an in-memory database and does not connect to Discord, register commands, or execute timers. Production snapshots are read-only inputs to tests, with imported databases created under temporary directories. Local snapshot comparisons cover 174 values but no real pending production timers; synthetic fixtures cover timer migration.

Verified on macOS with Node 25.9.0 (87/87 passing tests), and a clean Node 20.20.2 production-dependency install (83 passing; four private-snapshot tests skipped because no snapshot was copied). The production Linux runtime and live Discord environment still require the checks below. SQLite uses WAL with synchronous=FULL to persist the send claim before the network request.

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
