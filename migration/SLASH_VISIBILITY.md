# Slash response visibility audit

Compared the current handlers against the last pre-migration commit `bcaf5c3`
and the read-only `.migration/legacy/commands/` snapshot on September 29, 2026.

The legacy [interactionReply](https://aoi.js.org/functions/interactionreply/)
third argument is `ephemeral`, defaulting to false. The legacy
[interactionDefer](https://aoi.js.org/functions/interactiondefer/) argument
sets the initial response's visibility. A private defer followed by the first
follow-up still completes a private response; editing cannot make it public.

| Commands | Legacy normal response | Repair |
|----------|------------------------|--------|
| `addhours`, `senddm`, `noreply` | Public reply embeds, including closed-DM results | Remove private defer; remove private success flag from `noreply` |
| `latex` | Public confirmation and separately posted image | Remove private defer from confirmation |
| `terminal` | Public output / output file; owner-only execution | Remove private defer; retain owner check |
| `ai`, `echo`, `reload` | Public | Already correct |
| `8ball`, `avatar`, `banner`, `invite`, `owoify`, `reverse`, `ping` | Explicit private reply (`true` third argument) | Preserve |
| `ban`, `kick` | Explicit `{ephemeral}` on result embeds | Preserve |
| `denied`, `contributor` | Explicit private defer (`true`) | Preserve |
| `help` | Added during migration | Preserve current private response |
| `hours` | New slash command; prefix lookup was public | Public, using the same handler as `=hours` |

Permission/input rejections keep their existing private responses. This repair
does not change separately delivered DMs, logs, LaTeX images, or contributor
channel messages. Public results remain subject to Discord channel access.

`test/slash-visibility.test.js` executes every registered slash handler through
the real router/context with mocked Discord and HTTP operations and an in-memory
database. It records visibility at acknowledgement time and retains it during
edits, covering the original private-defer regression. It also checks closed-DM
results, unauthorized access, and `/hours` self/user lookup parity with `=hours`.
