# APSwiftly aoi.js → Discord.js porting conventions

Every ported command lives at the same path under `commands/` as before. The
legacy source is always available at `.migration/legacy/commands/<same path>`
(read-only reference). Never edit `.migration/`.

## Module shapes

Prefix command:

```js
module.exports = {
  name: "ping",
  aliases: ["pong"],            // optional, string or array
  info: { description: "...", perms: ["`SendMessages`"], usage: "..." },
  cooldown: { time: 3000, message: "Slow down! ... %time% ..." }, // optional
  ownerOnly: false,             // optional
  async execute(ctx) { /* ... */ },
};
```

Slash command:

```js
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  slash: {
    name: "ping",
    description: "Returns latency.",
    options: [],                 // raw API JSON or builder output
    defaultMemberPermissions: null,
    guildOnly: false,
    dmPermission: false,
  },
  async execute(ctx) { /* ctx.options = CommandInteractionOptionResolver */ },
};
```

Event handler:

```js
module.exports = {
  event: "guildMemberAdd",       // aoi event name (join/leave/memberUpdate/...)
  async execute(ctx) { /* ctx.member, ctx.guild, ... */ },
};
```

Button / select / modal:

```js
module.exports = {
  component: "button",           // "button" | "select" | "modal"
  customId: "earlycheckin",      // string prefix match, RegExp, or function
  async execute(ctx) {
    ctx.customId, ctx.parts, ctx.values, ctx.user, ctx.member, ctx.guild,
    ctx.reply(), ctx.update(), ctx.defer(), ctx.followUp(), ctx.showModal()
  },
};
```

Persistent job (replaces `type: "timeout"`):

```js
module.exports = {
  job: "remi",
  async execute(payload, job, client) { /* ... */ },
};
```

- `payload` is the JSON payload stored with the job.
- `job.id` replaces `$currentTimeoutID`; compare it to the persisted
  `checkintimeoutid` channel var before sending anything.
- Register jobs in `index.js` via `client.services.scheduler.register(type, handler)`
  or export `{ job }` and let the scheduler bind registered types after load.

Always-execute middleware:

```js
module.exports = {
  event: "alwaysExecute",
  async execute(ctx) { /* ctx.message */ },
};
```

Awaited helpers become normal exported functions in `src/services/` (or local
functions) and are called directly. No awaited registry.

## ctx API (prefix commands)

| API | aoi equivalent |
|-----|----------------|
| `ctx.args`, `ctx.arg(n)` | `$message`, `$message[n]` (1-indexed) |
| `ctx.argsFrom(n)` | `$messageSlice[n]` |
| `ctx.message`, `ctx.channel`, `ctx.guild`, `ctx.member`, `ctx.author` | Discord objects |
| `ctx.send(payload)`, `ctx.reply(payload)` | `$sendMessage`, `$reply` |
| `ctx.embed(desc, { title, color, footer, timestamp, fields })` | `{newEmbed:{...}}` |
| `ctx.getVar(name)`, `ctx.setVar`, `ctx.deleteVar` | `$getVar`, `$setVar`, `$deleteVar` |
| `ctx.getGuildVar(name)`, `ctx.setGuildVar` | `$getGuildVar`, `$setGuildVar` |
| `ctx.getUserVar`, `ctx.setUserVar` | `$getUserVar`, `$setUserVar` |
| `ctx.getGlobalUserVar(userId, name, "custom")` | `$getGlobalUserVar` |
| `ctx.setGlobalUserVar(userId, name, value, "custom")` | `$setGlobalUserVar` |
| `ctx.getChannelVar(name, "custom")`, `ctx.setChannelVar` | `$getChannelVar`, `$setChannelVar` |
| `ctx.services.*` | scheduler, cooldowns, hours, leveling, logging |
| `ctx.helpers.owoify(text)` | `$owoify` |
| `ctx.helpers.createProgressBar(v, max, n)` | `$createProgressBar` |
| `ctx.helpers.randomColor()` | `$randomColor` |
| `ctx.client.registry.commandExists(name)` | `$commandExists` |

The `db` accessor expression is the same for components (`ctx.db`) and events
(`ctx.db`).

## Effective execution order

aoi.js evaluates DSL functions **bottom-up**: the last line runs first. When
translating, read the legacy `code` from the bottom upwards and implement the
same order:

1. permission/usage validations (`$onlyPerms`, `$onlyIf`, `$onlyForGuilds`,
   `$onlyForCategories`, `$cooldown`)
2. `$let`/`$get` intermediate computation
3. side effects (`$sendMessage`, `$setGuildVar`, `$setTimeout`, ...)

Validation failure behaviour: send the provided error payload and stop.
`{ephemeral}` + `{interaction}` in an interaction error object mean an
ephemeral reply. `ctx.interaction` is available for slash/component commands.

## Translation cheat-sheet

- `{newEmbed:{title:X}{description:Y}{color:00ff00}{footer:F}{timestamp}}`
  → `ctx.embed(Y, { title: "X", color: "#00ff00", footer: "F", timestamp: true })`
- `{actionRow:{button:Label:primary:customid:false:🔔}}`
  → `new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("customid").setLabel("Label").setStyle(ButtonStyle.Primary).setEmoji("🔔"))`
- Styles: `primary`→1, `secondary`/`2`→2, `success`/`3`→3, `danger`/`4`→4, `link`→5.
- `$interactionReply[...;users;true]` → `interaction.reply({ ..., flags: 64 })`
  when ephemeral is true (`true`/`all` → ephemeral? follow the legacy call:
  third argument `true` = ephemeral, second argument is the mention target).
- `$editmessage[id; payload; channelId]` → fetch the message in that channel and
  `.edit(payload)`.
- `$sendDM[payload; userId]` → `client.users.fetch(userId).then(u => u.send(payload))`.
- `$parseTime[x]` → `parseTime(x)` from `src/utils/time`.
- `$dateStamp` → `Date.now()`.
- `$truncate[$divide[$sum[t;$dateStamp];1000]]` → `Math.trunc((t + Date.now()) / 1000)`.
- `$get[var]` from `$let[var;...]` → local JS variable. Remember bottom-up order:
  `$let` lines appear *below* the lines that use them.
- `$randomText[a;b;c]` → `pick(["a","b","c"])` from `src/utils/random`.
- `$random[1;10]` → random integer in range inclusive.
- `$mentioned[1]` → `message.mentions.users.first()?.id`; `$mentioned[1;true]` →
  fall back to author when no mention.
- `$username[$clientID]` → `client.user.username`.
- `$clientID` → `ctx.client.user.id`.
- `$guildName`, `$guildDescription` → `ctx.guild?.name`, `ctx.guild?.description`.
- `$djsEval[...;true]` → inline JavaScript.
- `$suppressErrors[payload]` → wrap the risky section in try/catch and send the
  payload on failure.
- `$onlyForGuilds[id;msg]` → `if (ctx.guild?.id !== "id") return ctx.send(msg)`
  before any side effect.
- `$onlyForCategories[id;msg]` → `if (ctx.channel?.parentId !== "id") return ctx.send(msg)`.
- `$onlyPerms[perm;msg]` → `if (!ctx.hasPerms(PermissionFlagsBits.ManageGuild)) return ctx.send(msg)`.
- `$hasPerms[$guildID;$authorID;administrator]` → `ctx.isAdministrator()`.
- `$hasRoles[$guildID;$authorID;id]` → `ctx.member?.roles?.cache?.has("id")`.
- `$addCmdReactions[emoji]` → `message.react(emoji)`.
- `$deleteMessage[id]` → fetch + delete, or `message.delete()`.

Never keep `$`-style DSL in the ported code. Never `require("aoi.js")` or
`require("@aoijs/aoi.db")` from any file under `commands/` or `src/` (except
`src/migration/` tooling).

## Hard-coded IDs (must be preserved)

- Volunteer guild: `859910344393883710`
- Contributor category: `1356279309169328158`
- Contributor ping role: `1258652618482389014`
- Contributor view/staff role: `1519016533005832332`
- Volunteer log channel: `1519543164891955401`
- Archive role: `1319501912638226543`
- Archive category: `1550896740096548894`
- Trash reaction emoji: `1367302883032301651`
- Volunteer form: `https://forms.gle/R2LMVDcugiPwJFJZ9`
