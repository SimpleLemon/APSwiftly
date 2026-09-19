"use strict";

const {
  buildSettingsMenu,
  buildSettingsEmbed,
  buildToggleRow,
  SETTINGS,
  isEnabled,
} = require("../../../../src/services/settingsMenu");

const SELECT_KEYS = { autoreply: "autoreply", includebots: "includebots", anonymous: "anonymous" };

function ownerMismatch(ctx) {
  return ctx.parts[1] !== ctx.authorId;
}

module.exports = [
  {
    component: "select",
    customId: "settingsmenu",
    async execute(ctx) {
      if (ownerMismatch(ctx)) {
        return ctx.reply("This interaction is not for you.", { flags: 64 });
      }
      const key = SELECT_KEYS[ctx.values[0]];
      if (!key) return;

      await ctx.update({
        embeds: [buildSettingsEmbed(ctx, key)],
        components: [buildSettingsMenu(ctx), buildToggleRow(ctx, key)],
      });
    },
  },
  {
    component: "button",
    customId: "autoreplytoggle",
    async execute(ctx) {
      await toggle(ctx, "autoreply");
    },
  },
  {
    component: "button",
    customId: "includebotstoggle",
    async execute(ctx) {
      await toggle(ctx, "includebots");
    },
  },
  {
    component: "button",
    customId: "anonymoustoggle",
    async execute(ctx) {
      await toggle(ctx, "anonymous");
    },
  },
];

async function toggle(ctx, key) {
  if (ownerMismatch(ctx)) {
    return ctx.reply("This interaction is not for you.", { flags: 64 });
  }

  const setting = SETTINGS[key];
  const currentlyOn = isEnabled(ctx.getGuildVar(setting.variable));
  const resultMessage = currentlyOn ? setting.offMessage : setting.onMessage;

  ctx.setGuildVar(setting.variable, currentlyOn ? "off" : "on");

  await ctx.update({
    embeds: [buildSettingsEmbed(ctx, key)],
    components: [buildSettingsMenu(ctx), buildToggleRow(ctx, key)],
  });
  await ctx.followUp({ content: resultMessage, flags: 64 });
}
