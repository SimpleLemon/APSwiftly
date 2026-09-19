"use strict";

const { buildHelpMenu, buildHelpEmbed, canUseModule } = require("../../../../src/services/helpMenu");

const MODULE_LABELS = {
  main: "Main",
  entertainment: "Entertainment",
  leveling: "Leveling",
  util: "Util",
  moderation: "Moderation",
  apstudy: "APStudy",
  volunteer: "Volunteer",
  dev: "Developer",
};

/**
 * Native port of the help menu select handlers. The legacy implementation had
 * one selectMenu handler per module gated by `$getSelectMenuValues[all]` and an
 * owner check on the customId suffix.
 */
module.exports = {
  component: "select",
  customId: "helpmenu",
  async execute(ctx) {
    const userId = ctx.parts[1];
    if (userId !== ctx.authorId) {
      return ctx.reply("This interaction is not for you.", { flags: 64 });
    }

    const module = ctx.values[0];
    if (!MODULE_LABELS[module]) return;

    if (!canUseModule(ctx.client, ctx, module)) {
      return ctx.reply("You no longer have access to this module.", { flags: 64 });
    }

    const embed = buildHelpEmbed(ctx.client, ctx, module);
    await ctx.update({ embeds: [embed], components: [buildHelpMenu(ctx.client, ctx)] });
  },
};
