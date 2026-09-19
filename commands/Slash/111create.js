"use strict";

module.exports = {
  name: "acreate",
  info: {
    description: "Creates the application commands.",
    perms: ["`SendMessages`"],
    dev: "true",
  },
  async execute(ctx) {
    if (!ctx.client.ownerIds.includes(ctx.authorId)) return;

    await ctx.client.services.slash.syncAll();
    // Legacy cleanup: these user-app commands were removed from the application.
    for (const name of ["randomcolor", "about", "report"]) {
      await ctx.client.services.slash.deleteGlobal(name).catch(() => {});
    }
    await ctx.send("Done without errors.");
  },
};
