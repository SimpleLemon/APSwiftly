# Keeping This File Up to Date

Every agent that makes structural changes to the project **MUST** update this file before finishing.

Structural changes include: adding/removing aoi.db tables, adding new top-level command folders or major automation modules, changing global/guild/user variable schemas in `handlers/variables.js`, adding custom `$function` definitions, changing bot-owner or guild-restriction patterns, or changing APStudy API integration endpoints.

If you skip this step, future agents will work from a stale map and make mistakes.

---

## Project Details: APSwiftly

APSwiftly is the official Discord bot for [APStudy](https://apstudy.org) — a free AP exam study platform. It provides community moderation tools, volunteer-hour tracking, contributor-program workflows, entertainment commands, leveling, logging, and APStudy-specific utilities (check-in reminders, AI chat, LaTeX rendering).

**Homepage:** https://apstudy.org/  
**Repository:** https://github.com/SimpleLemon/APSwiftly.git  
**Upstream base:** [Dodo-Bot](https://github.com/ddodogames/Dodo-Bot) (aoi.js v6 community bot; many Dodo-Bot references remain in help text and version UI)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js ≥ 20.x |
| Bot framework | [aoi.js](https://aoi.js.org/) v6.9 (`AoiClient` in `index.js`) |
| Database | `@aoijs/aoi.db` KeyValue store (tables: `main`, `custom`) |
| Config | `config.json` (gitignored) + `.env` for secrets |
| HTTP | `axios` (LaTeX SVG fetch, AI API) |
| Image processing | `sharp` (LaTeX → PNG for `$renderMath`) |
| Games | `discord-gamecord` (embedded mini-games) |
| Console styling | `chalk` (startup logs) |

---

## Architecture & Conventions

### Entry Point (`index.js`)

1. Creates `AoiClient` with Discord intents, events, and aoi.db configuration.
2. Loads all commands recursively from `./commands/` via `client.loadCommands()`.
3. Registers default variables from `handlers/variables.js` (both `main` and `custom` tables).
4. Registers custom functions from `handlers/functions.js` plus inline `$renderMath` (DJS function).
5. Sets bot status to `PLAYING /help | apstudy.org`.

### Command Model (aoi.js DSL)

Commands are JavaScript files under `commands/` that export one or more command objects. Each object has a `name`, optional `info`, and a `code` string written in aoi.js's embedded DSL (`$sendMessage`, `$getGuildVar`, `$onlyIf`, etc.).

**Command types:**

| Type | How defined | Examples |
|------|-------------|----------|
| Prefix | Default (`name` + `code`) | `help`, `settings`, `addhours` |
| Slash | `type: "interaction"`, `prototype: "slash"` | `ai`, `latex`, `slash-addhours` |
| Button / Select / Modal | `type: "interaction"`, `prototype: "button"` etc. | `earlycheckin`, `helpmenu` |
| Awaited | `type: "awaited"` | `invitationgreeting`, `showdevwarning` |
| Timeout | `type: "timeout"` | `checkinTimeout` |
| Event hooks | `type: "ready"`, `"guildJoin"`, `"functionError"`, etc. | startup messages, error logger |
| Always-execute | `name: "$alwaysExecute"` | leveling XP on message |

Interaction handlers live in `commands/Automation/Interactions/`. Event listeners live in `commands/Automation/Events/`. Deferred/timeout logic lives in `commands/Automation/Awaited/`.

### Data Storage Model

aoi.db KeyValue storage with two tables configured in `index.js`:

| Table | Scope | Purpose |
|-------|-------|---------|
| `main` | Global, guild, and per-guild-user vars | Bot settings, per-server config (prefix, welcomer, logs, leveling), per-user XP/level |
| `custom` | Global-user and per-channel vars | Volunteer hours, check-in state |

**Variable accessors in command code:**

| Accessor | Scope | Table |
|----------|-------|-------|
| `$getVar` / `$setVar` | Global (bot-wide) | `main` |
| `$getGuildVar` / `$setGuildVar` | Per Discord server | `main` |
| `$getUserVar` / `$setUserVar` | Per user per guild | `main` |
| `$getGlobalUserVar` / `$setGlobalUserVar` | Per user (cross-guild) | `custom` |
| `$getChannelVar` / `$setChannelVar` | Per channel | `custom` |

Default values for global vars are seeded in `handlers/variables.js`. Guild/user/channel vars are created on first write.

Database files are stored under `database/` locally (gitignored) or `AOI_DB_PATH` when set. Security key: `DBsecurityKey` in `.env` or `config.json`. See `APSWIFTLY_DB_CONTEXT.md` (gitignored) for production paths and backup.

### Access Control Patterns

| Pattern | Usage |
|---------|-------|
| `$clientOwnerIDs` | Bot owner check for Developer commands (`dev-panel`, `eval`, `update`, etc.) |
| `$onlyPerms[manageguild;…]` | Server admin settings (`settings`, `prefix`) |
| `$onlyIf[$hasPerms[…;administrator]==true;…]` | APStudy staff commands |
| `$onlyForGuilds[<guildId>;…]` | Hard-coded guild lock (volunteer tracking → `859910344393883710`) |
| `$onlyForCategories[<categoryId>;…]` | Category lock for contributor-area commands → `1356279309169328158` |
| `$getVar[userapps]` | Gate for Discord User App slash commands |

Bot owner IDs are configured in aoi.js client options (not in repo). Developer module is hidden from help menu unless the user is a bot owner.

### Custom Functions

Defined in `handlers/functions.js` (aoi.js type) and `index.js` (DJS type):

| Function | Type | Purpose |
|----------|------|---------|
| `$clientAvatar` | aoi.js | Shortcut for bot avatar URL |
| `$randomTopic` | aoi.js | Random conversation prompt |
| `$8ballanswers` | aoi.js | Magic 8-ball responses |
| `$hasUserTag` | aoi.js | Legacy discriminator check |
| `$userURL` | aoi.js | Discord profile URL |
| `$commandExists` | aoi.js | Check if command name is registered |
| `$autoList` | aoi.js | Split text into formatted list |
| `$createProgressBar` | djs | ASCII progress bar |
| `$excludeSpecialChars` | aoi.js | Strip special characters |
| `$randomColor` | djs | Random hex color (user apps) |
| `$owoify` | aoi.js | OwO text transform |
| `$messageAttachments` | djs | Comma-separated attachment URLs |
| `$renderMath` | djs | LaTeX → PNG via math.now.sh + sharp; trash-reaction delete |

---

## Global Variables (`handlers/variables.js` → `main` table)

| Variable | Purpose |
|----------|---------|
| `version`, `versionCodename`, `buildNumber`, `buildDate`, `buildBranch`, `buildRevision`, `buildStatus`, `release_type` | Version metadata (shown in `/version` UI) |
| `pre_release`, `DevReleaseTypeToSet`, `showbuildinfo` | Pre-release / build-info toggles |
| `prefix`, `originalprefix` | Default prefix (overridable per guild) |
| `embedcolor`, `originalembedcolor` | Default embed color |
| `suggestionchannel`, `pollchannel` | Channel IDs for suggestion/poll systems |
| `welcomesystem`, `welcomechannel`, `welcomemessage`, `welcometype`, `welcomemessageembedcolor` | Welcomer config |
| `leavesystem`, `leavechannel`, `leavemessage`, `leavetype`, `leavemessageembedcolor` | Leave-message config |
| `msgeventschannel`, `servereventschannel`, `membereventschannel` | Log channel IDs |
| `msgdeletelog`, `msgeditlog`, `banneduserslog`, `unbanneduserslog`, `roleuserslog`, `Integrationlog`, `nicknameupdatelog`, `nameupdatelog` | Log feature toggles |
| `anonymous` | Hide moderator names in logs |
| `levelsystem`, `level`, `previouslevel`, `xp`, `xpLimit`, `levelmessage`, `levelingmessagechannel`, `levelmessagefeature`, `levelleaveonreset`, `islevelingreset`, `levelingexcludedchannels`, `levelingexcludedcategories` | Leveling system |
| `errorchannel`, `errorsystem`, `startupchannel`, `startupchannelsystem` | Dev error/startup channels |
| `botinvitationmessage`, `servermemberrequirement` | Auto-greet / min-member gate on guild join |
| `userapps`, `isuserappsalreadysetup` | Discord User App slash command registration |
| `autopingreply`, `includebots`, `errorsdisabled` | Misc toggles |
| Game prefs | `trivia_type`, `trivia_difficulty`, `flood_difficulty`, `wyr`, `hangman_theme` |

## Custom Table Variables (`handlers/variables.js` → `custom` table)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `hours` | Global user | Volunteer hour count |
| `checkinid`, `checkintimeoutid` | Per channel | Active check-in message/timeout IDs |
| `channelid` | Global user | Transient state for contributor/marketing flows |
| `useraitokenusage` | Global user | AI token usage tracking |

---

## APStudy Integrations

| Integration | Endpoint / ID | Used by |
|-------------|---------------|---------|
| AI chat API | `https://api.apstudy.org/ai/discord?message=…` | `/ai` slash command |
| LaTeX rendering | `https://math.now.sh` (via `$renderMath`) | `/latex` slash command |
| Contributor role ping | `1258652618482389014` | `checkin` early/timeout pings |
| Contributor category | `1356279309169328158` | `checkin`, `grammar` category lock; `contributor`, `slash-contributor`, `marketing` channel creation |
| Contributor channel view role | `1519016533005832332` | View access on channels created by `contributor`, `slash-contributor`, `marketing` |
| Archive role | `1319501912638226543` | Permission to run the prefix `archive` command |
| Archive category | `1287225603615096885` | Destination category for channels moved by `archive` |
| Volunteer guild | `859910344393883710` | `addhours`, `slash-addhours` |
| Volunteer form | `https://forms.gle/R2LMVDcugiPwJFJZ9` | `join` command button |
| APStudy staff refs | User IDs in `contributor` welcome embed | Contributor onboarding |

---

## Project Structure

```
APSwiftly/
├── index.js                 # AoiClient bootstrap, $renderMath, command loading
├── config.json              # Bot config (gitignored — see Environment Variables)
├── handlers/
│   ├── variables.js         # Default global variable seeds (main + custom)
│   └── functions.js         # Custom aoi.js / DJS helper functions
├── commands/                # All bot commands (auto-loaded recursively)
│   ├── Main/                # help, settings, stats, invite, ping, perms, commandinfo
│   ├── Info/                # user, serverinfo
│   ├── Util/                # prefix, welcomer, leave, logs, poll, suggest, remind, webscreenshot
│   ├── Moderation/          # slash-ban, slash-kick
│   ├── Entertainment/       # games, images, text commands
│   ├── Automation/          # Events, Interactions, Awaited, Others (leveling, startup, user apps)
│   ├── Developer/           # dev-panel, eval, exec, update, shutdown, serverlist
│   ├── Slash/               # Global/user-app slash commands
│   ├── Misc/                # avatar, banner, randomcolor
│   ├── zAPStudy Specific/   # APStudy-only staff commands
│   └── zVolunteer Tracking/ # Volunteer hours (guild-locked)
├── database/                # aoi.db KeyValue files (gitignored)
├── package.json
└── .env                     # BotToken, DBsecurityKey (gitignored)
```

### Command Folders (file counts approximate)

| Folder | Files | Purpose |
|--------|-------|---------|
| `Entertainment/` | ~39 | Games (wordle, trivia, rps, etc.), image memes, text fun |
| `Automation/` | ~35 | Event logs, button/select handlers, leveling, welcomer, startup |
| `Slash/` | ~16 | Slash commands (ai, latex, avatar, ban, kick, addhours, etc.) |
| `zAPStudy Specific/` | 10 | checkin, contributor, grammar, join, marketing, moderation helpers |
| `Developer/` | 10 | Owner-only dev tools |
| `Util/` | 8 | Server utility commands |
| `Main/` | 7 | Core user-facing commands |
| `zVolunteer Tracking/` | 5 | hours, addhours, leaderboard, pvsa, cite |
| `Misc/` | 3 | avatar, banner, randomcolor |
| `Moderation/` | 2 | slash-ban, slash-kick |
| `Info/` | 2 | user, serverinfo |

### Key APStudy-Specific Commands (`zAPStudy Specific/`)

| Command | Purpose |
|---------|---------|
| `checkin` | Scheduled contributor check-in reminders (buttons + timeout) |
| `contributor` | Create contributor channel with permissions |
| `slash-contributor` | Slash flow for contributor program acceptance DM |
| `marketing` | Marketing intern acceptance DM flow |
| `join` | Volunteer application embed with Google Form link |
| `grammar` | Post grammar-tool suggestions in contributor category |
| `archive` | Move the current channel to the archive category and post a notice with an optional reason |
| `bypass`, `cheater`, `scam`, `noad` | Moderation / policy helper commands |

### Volunteer Tracking (`zVolunteer Tracking/`)

| Command | Purpose |
|---------|---------|
| `addhours` / `slash-addhours` | Admin: add volunteer hours (guild `859910344393883710` only) |
| `hours` | View a user's volunteer hours |
| `leaderboard` (`rich`, `lb`) | Top-10 volunteer hours leaderboard |
| `pvsa` | Presidential Volunteer Service Award eligibility info |
| `cite` | Citation/reference helper |

### Automation Systems

| System | Key files | Notes |
|--------|-----------|-------|
| Leveling | `Automation/Others/Systems/levelup.js`, `leveling-interactions.js` | XP on message; level-up announcements |
| Welcomer / Leave | `Util/welcomer.js`, `Util/leave.js`, `welcomer-interactions.js`, `leave-interactions.js` | Configurable join/leave messages |
| Logging | `Automation/Events/*-logs.js`, `Util/logs.js`, `logs-interaction.js` | Message, member, moderation, integration logs |
| Error logging | `Automation/Events/error-logs.js` | Posts aoi.js function errors to dev channel |
| User Apps | `Automation/Others/Systems/userappsupport.js` | Registers global slash cmds on ready |
| Game settings | `games-settings.js`, `game-timeouts.js` | Per-server game difficulty prefs |
| Pre-release mode | `pre-release-modedecider.js` | Dev build warnings |

---

## Common Commands

### Development

```bash
# Install dependencies
npm install
# or
npm run setup

# Start bot (requires config.json and/or .env)
npm start
# or
node index.js

# Start without Node deprecation warnings
npm run startWithoutDeprecation

# Pull latest and restart
npm run UpdateandStart
```

### In-Discord (owner)

| Command | Purpose |
|---------|---------|
| `update` / `reload` | Hot-reload all commands (`$updateCommands`) |
| `dev-panel` | Owner settings UI (embed color, pre-release, error logging, etc.) |
| `eval` / `jseval` / `exec` | Code execution (owner only) |
| `refreshslash` | Re-register slash commands |
| `shutdown` | Graceful shutdown with confirmation button |

### In-Discord (server admin)

| Command | Purpose |
|---------|---------|
| `settings` | Guild settings select menu |
| `prefix` / `prefix-reset` | View or change command prefix |
| `logs` | Configure event log channels |
| `welcomer` / `leave` | Configure join/leave messages |

---

## Environment Variables & Config

Secrets live in `.env` (preferred) or `config.json` (gitignored). Never commit tokens or DB keys.

### `.env`

| Variable | Purpose |
|----------|---------|
| `BotToken` | Discord bot token |
| `DBsecurityKey` | aoi.db encryption/security key |
| `AOI_DB_PATH` | aoi.db data directory (default `./database/`; production: `/var/www/nest.apstudy.org/instance/apswiftly/`) |

### `config.json` keys (referenced in code)

| Key | Purpose |
|-----|---------|
| `BotToken` | Discord bot token (fallback if env unset) |
| `DBsecurityKey` | Database security key (fallback) |
| `prefix` | Default command prefix (e.g. `d!`) |
| `Embedcolor` | Default embed hex color |
| `MobileStatus` | Show mobile/platform status in Discord |
| `EnableDebugMode` | aoi.js interpreter debug logging |
| `DisableAllErrors` | Suppress aoi.js error output |
| `respondOnEdit` | Re-run commands when messages are edited |
| `LogCommands` | Log command loading to console |
| `EnableUserApps` | Enable Discord User App slash commands |

Example minimal `config.json` (create locally; do not commit):

```json
{
  "BotToken": "YOUR_TOKEN",
  "DBsecurityKey": "YOUR_DB_KEY",
  "prefix": "d!",
  "Embedcolor": "#5865F2",
  "MobileStatus": false,
  "EnableDebugMode": false,
  "DisableAllErrors": false,
  "respondOnEdit": false,
  "LogCommands": true,
  "EnableUserApps": true
}
```

---

## Repo Conventions

- Preserve the aoi.js command-file structure: one `.js` file per feature area, export `module.exports` as object or array of command defs.
- Place new prefix commands in the appropriate `commands/` subfolder; interaction handlers go under `commands/Automation/Interactions/`.
- Use `$getGuildVar` for per-server settings and `$getVar` for bot-global settings — do not hardcode channel IDs unless APStudy-specific (document in this file).
- New global default variables: add to `handlers/variables.js` under the correct table (`main` or `custom`) and document here.
- New custom functions: add to `handlers/functions.js` (or `index.js` for DJS-only functions that need npm imports) and document here.
- Developer/owner commands must gate on `$clientOwnerIDs`.
- Keep APStudy-specific commands in `zAPStudy Specific/` or `zVolunteer Tracking/` rather than mixing into generic folders.
- Treat the worktree as potentially dirty; do not revert or overwrite unrelated user changes.
- Upstream Dodo-Bot references (branding, GitHub links) may still exist — update carefully when rebranding.
- `config.json`, `.env`, `database/`, and `node_modules/` are gitignored.

---

## Production / VPS

Production host: same VPS as [nest.apstudy.org](https://nest.apstudy.org) (see `VPS_CONTEXT.md` locally — gitignored).

| Item | Value |
|------|-------|
| App directory | `/var/www/apswiftly/` |
| systemd service | `apswiftly.service` (`deploy/apswiftly.service`) |
| Process user | `deployer` |
| aoi.db path (prod) | `/var/www/nest.apstudy.org/instance/apswiftly/` via `AOI_DB_PATH` |
| Secrets | `/var/www/apswiftly/.env` (never commit) |
| DB reference doc | `APSWIFTLY_DB_CONTEXT.md` (gitignored; copy to VPS) |

**Env vars (production):** `BotToken`, `DBsecurityKey`, `AOI_DB_PATH=/var/www/nest.apstudy.org/instance/apswiftly/`. Template: `.env.example`.

**Deploy (manual):** after `git push origin main`, on VPS run `bash /var/www/apswiftly/deploy/update.sh` (pull, `npm install --omit=dev`, restart).

**Operations:**

```bash
sudo systemctl restart apswiftly
journalctl -u apswiftly --no-pager -n 50
```

Nest (`nest.service`) and APSwiftly are isolated: separate directories, separate systemd units, no shared SQLite — aoi.db lives only under `instance/apswiftly/`.

---

## Production Notes

- Version: `2.2.2-build.2196` (codename "Electric") per `package.json` / `handlers/variables.js`.
- No automated test suite (`npm test` is a placeholder).
- Production uses systemd (`apswiftly.service`); local dev uses `npm start` / `node index.js`.
- `config.json` is optional when all settings come from `.env` (production); defaults apply if missing.
- Database path is env-driven: `AOI_DB_PATH` (default `./database/`). See `APSWIFTLY_DB_CONTEXT.md` for full DB layout and backup notes.
- After adding or changing slash commands, run `refreshslash` (owner) or restart with user-apps ready handler to register globals.

---

## Current Environment Notes

- Local workspace path may differ from production host.
- `config.json` and `.env` are not in the repo — agents must not create or commit real tokens.
- The sandbox runner may fail on some commands; harmless read-only operations may need approval outside the sandbox.
- Assume modified and untracked files in the worktree are user-owned unless proven otherwise.
- Guild/category/role IDs for APStudy features are hardcoded in command files — verify they still match the live Discord server before changing behavior.
