"use strict";
module.exports = { event: "ready", once: true, async execute(ctx) {
  await ctx.client.services.slash.syncIfChanged();
  ctx.db.setVar("isuserappsalreadysetup", "yes");
} };
