# Keeping This File Up to Date

Every agent that makes structural changes to the project **MUST** update this file before finishing.

Structural changes include: adding/removing SQLite tables or namespaces, adding new top-level command folders or major automation modules, changing the variable schema in `src/db/defaults.js`, adding custom utility services, changing bot-owner or guild-restriction patterns, changing slash-command definitions, or changing APStudy API integration endpoints.

If you skip this step, future agents will work from a stale map and make mistakes.

---

## Project Details: APSwiftly

APSwiftly is the official Discord bot for [APStudy](https://apstudy.org) — a free AP exam study platform. It provides community moderation tools, volunteer-hour tracking, contributor-program workflows, entertainment commands, leveling, logging, and APStudy-specific utilities (check-in reminders, AI chat, LaTeX rendering).

**Homepage:** https://apstudy.org/  
**Repository:** https://github.com/SimpleLemon/APSwiftly.git  
**Upstream base:** [Dodo-Bot](https://github.com/ddodogames/Dodo-Bot) (originally an aoi.js v6 community bot; some Dodo-Bot branding remains in help/version text)

**Migration status:** APSwiftly was migrated from aoi.js v6 + `@aoijs/aoi.db` to native **discord.js v14 + SQLite (`better-sqlite3`)**. There is **no runtime dependency on aoi.js or aoi.db**. All command logic is plain JavaScript. The aoi source is preserved read-only under `.migration/legacy/` (gitignored) and the aoi.db → SQLite tooling lives under `src/migration/` + `migration/`.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js ≥ 20.x |
| Bot framework | [discord.js](https://discord.js.org/) v14.20.0 (`Client` in `src/client.js`) |
| Database | SQLite via `better-sqlite3` (`src/db/`) |
| Config | `.env` + optional `config.json` (gitignored) |
| HTTP | `axios` (LaTeX SVG fetch, AI API, image APIs) |
| Image processing | `sharp` (LaTeX → PNG for `renderMath`) |
| Games | `discord-gamecord` (embedded mini-games) |
| Console styling | `chalk` (dev dependency, startup logs) |

---

## Architecture & Conventions

### Entry Point (`index.js`)

1. Loads config (`src/config.js`) and builds the logger.
2. Calls `createBot()` (`src/client.js`): constructs the `Client`, opens SQLite, builds the repository and services, loads all commands into the registry, binds routers and events.
3. Sets presence to `PLAYING /help | apstudy.org` on ready.
4. Supports a validation mode: `APSWIFTLY_VALIDATION=1 node index.js` (or `npm run validate`) loads every module and prints registry stats **without connecting to Discord**.

### Runtime Structure (`src/`)

| Path | Responsibility |
|------|----------------|
| `src/client.js` | `createBot()` bootstrap, intents/partials, router + event binding, scheduler job registration |
| `src/config.js` | Config loading; env vars take precedence over `config.json`, then safe defaults |
| `src/logger.js` | Leveled console logger |
| `src/context.js` | `Context` (prefix commands) and `ComponentContext` (interactions) with the `ctx.*` API |
| `src/registry.js` | `Registry` of prefix/slash/component/event/job definitions |
| `src/loader.js` | Recursive command loader |
| `src/events.js` | aoi event name → discord.js event map + dispatcher |
| `src/routers/prefix.js` | Prefix parsing, permission/cooldown gates, message routing |
| `src/routers/interactions.js` | Slash, button, select and modal routing |
| `src/db/` | SQLite open/schema, `Repository`, `defaults`, `Scheduler`, `Cooldowns` |
| `src/services/` | hours, leveling, logging, welcomer, renderMath, errorReporter, checkins, controlServer, commandAccess, helpMenu, settingsMenu, welcomeMenu, levelingMenu, logsMenu, devPanel, autolist, slashRegistry, reload |
| `src/utils/` | text, random, time, http, resolve, templates, autolist, system |
| `src/slash/definitions.js` | Authoritative slash-command table (name, description, options, scopes, guild) |
| `src/migration/` | aoi.db reader, parity manifest, migration tool |

### Command Model (native discord.js)

Commands are JavaScript files under `commands/` that export one or more modules. Module shapes:

| Shape | Purpose | Example fields |
|-------|---------|----------------|
| `{ name, aliases?, info?, cooldown?, ownerOnly?, execute(ctx) }` | Prefix command | `ping`, `addhours` |
| `{ slash: { name }, info?, execute(ctx) }` | Slash command | `ai`, `latex` |
| `{ component: "button"\|"select"\|"modal", customId, execute(ctx) }` | Interaction | `earlycheckin`, `helpmenu` |
| `{ event: "<aoiEvent>", once?, execute(ctx) }` | Discord event hook | `guildMemberAdd` via `join` |
| `{ job: "<type>", execute(payload, job, client) }` | Persistent scheduler job | `remi`, `checkinTimeout` |

- `customId` may be a string (prefix-matched on `_`/`:` boundaries), a `RegExp`, or a function.
- Event names in modules use the **aoi names** (`ready`, `guildJoin`, `join`, `leave`, `memberUpdate`, `messageDelete`, `messageUpdate`, `banAdd`, `banRemove`, `alwaysExecute`); `src/events.js` maps them to discord.js.
- Slash **options/scope live only in `src/slash/definitions.js`**; slash modules only declare `slash: { name }`.
- `src/services/commandAccess.js` supplies shared command availability rules for prefix routing, slash routing, help, and commandinfo. Privileged component/modal routes recheck current permission on each interaction.
- Prefix help and `/help` list actual registry entries and aliases with the guild prefix. `commandinfo /name` supports slash metadata. ComponentContext inherits shared Context helpers and completes a deferred response via editReply.
- Hot reload validates a replacement registry before swapping, rebinds event handlers, and refreshes scheduler handlers. It retains the previous registry on validation failure.
- Legacy `type: "awaited"` handlers are now plain functions/services called directly.
- Legacy `type: "timeout"` handlers are scheduler jobs.

### Data Storage Model

SQLite (WAL mode, synchronous=FULL for durable pre-send claims) with a general key-value table plus operational tables (`src/db/database.js`):

| Table | Purpose |
|-------|---------|
| `kv(namespace, key, value_json, value_type, updated_at)` | Runtime variables. Namespaces: `main`, `custom` |
| `legacy_aoi_records` | Immutable audit copy of every migrated aoi record |
| `scheduled_jobs` | Persistent scheduler jobs, atomic claims, worker_id and lease_until |
| `checkins` | Durable manual/automatic check-in lifecycle, message IDs, nonce, outcome and error; unique unresolved check-in per channel |
| `checkin_channels` | Per-channel inactivity timestamp, post-completion cooldown and automatic-check-in opt-out |
| `cooldowns(scope, key, expires_at)` | Persistent per-command cooldowns |
| `meta` | Migration provenance |

**Key format (preserves aoi.js exactly):** `raw key = id ? \`${name}_${id}\` : name`

| Scope | Raw key | Repository helper |
|-------|---------|-------------------|
| Global | `name` | `getVar`/`setVar` |
| Guild | `name_<guildId>` | `getGuildVar`/`setGuildVar` |
| Guild user | `name_<userId>_<guildId>` | `getUserVar`/`setUserVar` |
| Global user | `name_<userId>` | `getGlobalUserVar`/`setGlobalUserVar` |
| Channel | `name_<channelId>` | `getChannelVar`/`setChannelVar` |
| Message | `name_<messageId>` | `getMessageVar`/`setMessageVar` |

- Missing values fall back to `src/db/defaults.js` (the old `handlers/variables.js` seeds), exactly like aoi.js kept defaults in memory.
- `hours` lives in the **`custom`** table as a global-user var; volunteer code uses `src/services/hours.js`.
- Database path: `SQLITE_PATH` env var, default `./database/apswiftly.sqlite`. `database/` is gitignored.

### Scheduler and Check-ins

- `src/db/scheduler.js` claims pending jobs atomically. Worker UUIDs and 60-second leases (renewed every 10 seconds) prevent a second startup from stealing live work. A 15-second sweep recovers expired leases; generic failed jobs retry after 30 seconds.
- Jobs start only after Discord is ready. Offline validation uses `:memory:` and never starts jobs or connects/registers commands.
- `src/services/checkins.js` owns all manual, automatic, early-send and cancel operations. `checkins` is authoritative; `checkinid`/`checkintimeoutid` are compatibility mirrors.
- Check-in lifecycle: `creating` → `pending` → `sending` → `sent`; `canceled`, `uncertain`, and `resolved` are additional outcomes. A partial unique index permits only one unresolved (`creating`, `pending`, `sending`, `uncertain`) record per channel.
- Reserve before scheduling-message creation. Atomically claim `pending` → `sending` before sending the role ping; use a stable nonce plus `enforceNonce`. Never retry an uncertain delivery. A process crash in `creating`/`sending` leaves the record blocked for staff review; no exactly-once claim is made for Discord delivery.
- Buttons contain the check-in ID and also verify the original scheduling message ID. Existing legacy buttons work only on the current imported message. Anyone who can access the channel may send early/cancel; both lose races safely against delivery.
- `checkin status` and `checkin resolve` require Administrator or staff role `1519016533005832332`. Resolve records review without resending, and does not resolve a recent in-progress operation (five-minute minimum).
- Automatic check-ins: guild `859910344393883710`, direct GuildText children of category `1356279309169328158`, scanned at startup/reconnect and every 15 minutes. Every new message counts, including bots/webhooks/system/attachments; edits/reactions do not. Verify latest message from Discord before scheduling; skip unreadable history.
- Three days of inactivity with no unresolved timer starts a four-day check-in. Messages during a timer do not cancel it. Another timer needs three days since the later of last activity and send/cancel/resolve.
- Automatic timer messages include gray `Disable auto check-ins`; Administrator is required on every click. It persists opt-out and cancels unsent automatic timers, leaving manual timers alone. `checkin auto on/off` provides reversible admin controls; enabling starts a fresh three-day wait.
- Archiving/moving out of the contributor category cancels pending timers. Archive destination is `1550896740096548894`.
- Legacy jobs convert idempotently; inconsistent/orphaned state is quarantined as `uncertain`. Stop the old bot before cutover. See `migration/VERIFICATION.md`.

### Custom Utilities

aoi `$function`s were replaced by ordinary modules:

| Old function | New location |
|--------------|--------------|
| `$clientAvatar` | `client.user.displayAvatarURL()` |
| `$randomTopic`, `$8ballanswers` | `src/utils/random.js` |
| `$userURL`, `$hasUserTag` | `src/utils/text.js` |
| `$commandExists` | `client.registry.commandExists()` |
| `$autoList` | `src/services/autolist.js` |
| `$createProgressBar`, `$randomColor`, `$excludeSpecialChars`, `$owoify` | `src/utils/text.js` |
| `$logVolunteerHours` | `src/services/hours.js` |
| `$currentTimeoutID` | `job.id` passed to scheduler handlers |
| `$changedRoleMentions` | `commands/Automation/Events/member-logs.js` |
| `$messageAttachments` | inline `message.attachments` |
| `$renderMath` | `src/services/renderMath.js` |

---

## Global Variables (`src/db/defaults.js` → `main` namespace)

Same variable names/defaults as the original `handlers/variables.js`. Highlights:

| Variable | Purpose |
|----------|---------|
| `version`, `versionCodename`, `buildNumber`, `buildDate`, `buildBranch`, `buildRevision`, `buildStatus`, `release_type` | Version metadata |
| `pre_release`, `DevReleaseTypeToSet`, `showbuildinfo` | Pre-release / build-info toggles |
| `prefix`, `originalprefix` | Default prefix (overridable per guild) |
| `embedcolor`, `originalembedcolor` | Default embed color |
| `suggestionchannel`, `pollchannel` | Suggestion/poll channel IDs (per-guild) |
| `welcomesystem`, `welcomechannel`, `welcomemessage`, `welcometype`, `welcomemessageembedcolor` | Welcomer |
| `leavesystem`, `leavechannel`, `leavemessage`, `leavetype`, `leavemessageembedcolor` | Leave messages |
| `msgeventschannel`, `servereventschannel`, `membereventschannel` | Log channel IDs |
| `msgdeletelog`, `msgeditlog`, `banneduserslog`, `unbanneduserslog`, `roleuserslog`, `Integrationlog`, `nicknameupdatelog`, `nameupdatelog` | Log toggles |
| `anonymous` | Hide moderator names in ban logs |
| `levelsystem`, `level`, `previouslevel`, `xp`, `xpLimit`, `levelmessage`, `levelingmessagechannel`, `levelmessagefeature`, `levelleaveonreset`, `islevelingreset`, `levelingexcludedchannels`, `levelingexcludedcategories` | Leveling |
| `errorchannel`, `errorsystem`, `startupchannel`, `startupchannelsystem` | Dev error/startup channels |
| `botinvitationmessage`, `servermemberrequirement` | Guild-join greeting / min-member gate |
| `userapps`, `isuserappsalreadysetup` | Legacy user-app flags retained for migration compatibility; public server slash commands no longer depend on personal-app enablement |
| `autopingreply`, `includebots`, `errorsdisabled` | Misc toggles |
| Game prefs | `trivia_type`, `trivia_difficulty`, `flood_difficulty`, `wyr`, `hangman_theme` |

## `custom` Namespace Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `hours` | Global user | Volunteer hour count |
| `checkinid`, `checkintimeoutid` | Per channel | Active check-in message/job IDs |
| `channelid` | Global user | Transient contributor/marketing state |
| `useraitokenusage` | Global user | AI token usage |

---

## Access Control Patterns

| Pattern | Usage |
|---------|-------|
| `client.ownerIds` | Bot owner check for Developer commands (`dev-panel`, `eval`, `update`, …) |
| `ctx.hasPerms(PermissionFlagsBits.ManageGuild)` | Server admin settings |
| `ctx.isAdministrator()` / role checks | APStudy staff commands |
| `guildOnlyIds` / explicit guild id checks | Volunteer tracking → `859910344393883710` |
| `ctx.channel.parentId` checks | Contributor category → `1356279309169328158` |
| `client.db.getVar("userapps")` | Gate for Discord User App slash commands |

Bot owner IDs come from `BOT_OWNER_IDS` (comma-separated env) — previously configured in aoi client options.

---

## APStudy Integrations

| Integration | Endpoint / ID | Used by |
|-------------|---------------|---------|
| AI chat API | `https://api.apstudy.org/ai/discord?message=…` | `/ai` |
| LaTeX rendering | `https://math.now.sh` via `src/services/renderMath.js` | `/latex` |
| Contributor role ping | `1258652618482389014` | `checkin` |
| Contributor category | `1356279309169328158` | `checkin`, `grammar`, contributor channel creation |
| Contributor view/staff role | `1519016533005832332` | contributor channels, `checkin`, `grammar`, `addhours`, `noreply` |
| Volunteer hours log channel | `1519543164891955401` | `src/services/hours.js` |
| Archive role | `1319501912638226543` | `archive` |
| Archive category | `1550896740096548894` | `archive` |
| Volunteer guild | `859910344393883710` | `addhours`, `/addhours`, `noreply` |
| Volunteer form | `https://forms.gle/R2LMVDcugiPwJFJZ9` | `join` |
| Trash reaction emoji | `1367302883032301651` | `renderMath` |

---

## Project Structure

```
APSwiftly/
├── index.js                 # Bootstrap + validation mode
├── src/
│   ├── client.js            # createBot()
│   ├── config.js, logger.js, context.js, registry.js, loader.js, events.js
│   ├── routers/             # prefix.js, interactions.js
│   ├── db/                  # database.js, repository.js, defaults.js, scheduler.js, cooldowns.js
│   ├── services/            # hours, leveling, logging, welcomer, renderMath, errorReporter, menus, slashRegistry, reload
│   ├── utils/               # text, random, time, http, resolve, templates, autolist, system
│   ├── slash/definitions.js # Authoritative slash command table
│   └── migration/           # aoiReader.js, migrate.js, parity.js
├── migration/
│   ├── migrate-aoi-to-sqlite.js  # Offline aoi.db → SQLite migration
│   ├── register-slash.js         # Opt-in live slash registration
│   └── CONVENTIONS.md            # Porting conventions
├── commands/                # All bot commands (auto-loaded recursively)
│   ├── Main/ Info/ Util/ Misc/ Moderation/ Entertainment/ Slash/
│   ├── Automation/          # Events, Interactions, Others, Awaited (now plain functions)
│   ├── Developer/
│   ├── zAPStudy Specific/
│   └── zVolunteer Tracking/
├── test/                    # node:test suites
├── deploy/                  # systemd unit + update.sh
└── database/                # SQLite + legacy aoi.db files (gitignored)
```

### Command Folders

| Folder | Purpose |
|--------|---------|
| `Entertainment/` | Games (`discord-gamecord`), image memes, text fun |
| `Automation/` | Event logs, button/select/modal handlers, leveling, welcomer, startup |
| `Slash/` | Slash commands (ai, latex, avatar, ban, kick, addhours, …) |
| `zAPStudy Specific/` | checkin, contributor, grammar, join, marketing, moderation helpers |
| `Developer/` | Owner-only dev tools |
| `Util/` | Server utility commands |
| `Main/` | Core user-facing commands |
| `zVolunteer Tracking/` | hours, addhours, leaderboard, pvsa, cite |
| `Misc/` | avatar, banner, randomcolor |
| `Moderation/` | slash-ban, slash-kick |
| `Info/` | user, serverinfo |

---

## Common Commands

### Development

```bash
npm install
npm start                 # node index.js
npm run validate          # load all modules without connecting
npm test                  # node --test
npm run migrate:aoi       # aoi.db -> SQLite (offline, read-only source)
```

### In-Discord (owner)

| Command | Purpose |
|---------|---------|
| `update` / `reload` | Hot-reload all commands (clears require cache, swaps registry) |
| `dev-panel` | Owner settings UI |
| `eval` / `jseval` / `exec` | Code execution (owner only) |
| `refreshslash` / `acreate` | Re-register slash/user-app commands |
| `shutdown` | Graceful shutdown with confirmation button |

### In-Discord (server admin)

| Command | Purpose |
|---------|---------|
| `settings` | Guild settings select menu |
| `prefix` / `prefix-reset` | View or change command prefix |
| `logs` | Configure event log channels |
| `welcomer` / `leave` | Configure join/leave messages |
| `leveling` | Configure leveling |

---

## Environment Variables & Config

Secrets live in `.env` (preferred) or `config.json` (gitignored). Env takes precedence; then `config.json`; then defaults in `src/config.js`.

| Variable | Purpose |
|----------|---------|
| `BotToken` | Discord bot token |
| `SQLITE_PATH` | SQLite file path (default `./database/apswiftly.sqlite`) |
| `BOT_OWNER_IDS` | Comma-separated owner user IDs |
| `DBsecurityKey`, `AOI_DB_PATH` | **Migration only** — not required at runtime |

---

## Slash-Command Registration

- `src/slash/definitions.js` is the single source of truth (names, descriptions, options, `default_member_permissions`, `integration_types`, `contexts`, `guildId`).
- `src/services/slashRegistry.js` (`SlashService`) validates option payloads and handler coverage before syncing global + managed guild definitions.
- Ready handler compares a hash of definitions and scopes stored in `meta.slash_definition_hash`; changed definitions sync all managed scopes. The legacy one-time setup flag no longer suppresses changes.
- Public commands support guild and personal installation. `/help` is server-only. `/addhours` and `/noreply` are scoped to guild `859910344393883710`; `/addhours` authorization is Administrator OR staff role, enforced at runtime. Guild registration payloads omit global-only installation/context fields.
- Global sync removes obsolete global registrations, including the former global `/addhours`, while preserving Discord Activity entry-point commands (type 4) to avoid API error 50240. Live sync is part of bot startup when definitions change; tests and validation never perform it.
- `refreshslash` / `acreate` (owner) call `client.services.slash.syncAll()`.
- `migration/register-slash.js` registers from the CLI but requires `APSWIFTLY_ALLOW_REGISTRATION=1` (it writes to the live Discord application).

---

## Local aoi.db Migration

```bash
# Read-only copy of production first (never modify production):
#   rsync the aoi.db directory + .env to .migration/production/
node migration/migrate-aoi-to-sqlite.js \
  --source .migration/production/apswiftly \
  --dest .migration/apswiftly.prod.sqlite \
  --report .migration/production/migration-report.json
```

- The source directory is opened read-only; scheme files are parsed directly (no aoi.db dependency).
- `main`/`custom` records copy verbatim into `kv`; every source record is archived in `legacy_aoi_records`.
- `setTimeout_*` records become `scheduled_jobs`; `cooldown_*` records become `cooldowns`.
- Unknown **active** timeout types abort the migration.
- Existing destinations are refused by default in both CLI and library. `--allow-existing` is explicit opt-in; live WAL/SHM sidecars prevent replacement. Imports are built and verified in a temporary sibling file before installation.
- Source structure, records and timeout types are validated before writing; only runtime-supported `remi` and `checkinTimeout` jobs import. Unknown/invalid active timeout records abort. `--dry-run` writes no report or database.

---

## Testing

`npm test` runs `node --test` over `test/`:

| Suite | Covers |
|-------|--------|
| `test/db.test.js` | key construction, all scopes, defaults, coercion, reset, transactions |
| `test/scheduler.test.js` | future/overdue jobs, cancellation, restart recovery, dedupe, idempotency |
| `test/migration.test.js` | lossless production import, checksums, archiving, timeout/cooldown decoding |
| `test/runtime.test.js` | loader, parity manifest, aliases, prefixes, restrictions, slash defs, services |
| `test/checkins.test.js` | actual handlers, competing processes, delivery uncertainty, restart recovery, inactivity, opt-outs, stale buttons and archival |
| `test/repairs.test.js` | settings, log toggles, slash visibility, help coverage, reload, deferred replies, isolated validation and archive destination |
| `test/static-gates.test.js` | no aoi DSL, no aoi requires, all modules load, package deps, gitignore |

---

## Production / VPS

Production host: same VPS as [nest.apstudy.org](https://nest.apstudy.org) (see `VPS_CONTEXT.md` locally — gitignored).

| Item | Value |
|------|-------|
| App directory | `/var/www/apswiftly/` |
| systemd service | `apswiftly.service` (`deploy/apswiftly.service`) |
| Process user | `deployer` |
| SQLite path (prod target) | `/var/www/nest.apstudy.org/instance/apswiftly/apswiftly.sqlite` via `SQLITE_PATH` |
| Secrets | `/var/www/apswiftly/.env` (never commit) |
| DB reference doc | `APSWIFTLY_DB_CONTEXT.md` (gitignored) |

**Env vars (production):** `BotToken`, `SQLITE_PATH=/var/www/nest.apstudy.org/instance/apswiftly/apswiftly.sqlite`, `BOT_OWNER_IDS`. Template: `.env.example`.

**Deploy (manual):** push the intended release branch, check it out on the VPS with its upstream configured, then run `deploy/update.sh` as `deployer`. It fast-forwards the current branch, installs with `npm ci --omit=dev`, validates offline, and restarts APSwiftly. `package-lock.json` is tracked for repeatable installs.

> **Cutover is a separate future task.** The migrated SQLite database must be produced from the production aoi.db snapshot and deployed deliberately; the runtime no longer reads aoi.db.

**Operations:**

```bash
sudo systemctl restart apswiftly
journalctl -u apswiftly --no-pager -n 50
```

---

## Production Notes

- Version: `3.0.0-build.2196`.
- No production changes were made during the migration; the production aoi.db was only read.
- `config.json` is optional; defaults apply if missing.
- Database path is env-driven via `SQLITE_PATH`.
- After changing slash definitions, use `refreshslash` (owner) or restart; definition-aware synchronization updates global and managed guild scopes. Previously managed guild scopes are recorded in `meta.slash_managed_guilds` so obsolete definitions can be cleared.

---

## Current Environment Notes

- Local workspace path may differ from production host.
- `config.json`, `.env`, `database/`, and `.migration/` are not in the repo — agents must not create or commit real tokens or production data.
- Guild/category/role IDs for APStudy features are hardcoded in command files — verify they still match the live Discord server before changing behavior.
- `.migration/legacy/` holds the original aoi.js source as a read-only reference for porting/verification. Do not edit it.

## Local Control API

`src/services/controlServer.js` preserves the production-only Nest integration previously implemented in `handlers/control-server.js`. It starts after Discord ready when `APSWIFTLY_CONTROL_TOKEN` is set; defaults to `127.0.0.1:3921` (overrides: `APSWIFTLY_CONTROL_HOST`, `APSWIFTLY_CONTROL_PORT`). All routes require `Authorization: Bearer <token>`. `GET /api/control/status` reports readiness and registry counts; `POST /api/control/reload`, `/api/control/refresh-slash`, and `/api/control/shutdown` use native services. The server never starts in offline validation. Keep it bound to loopback behind the existing authenticated Nest integration.
