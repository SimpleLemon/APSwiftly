"use strict";

module.exports = {
  name: "refreshslash",
  aliases: "restartslash",
  info: {
    description: "Updates user apps to the latest change done to them",
    perms: ["`SendMessages`"],
    dev: "true",
  },
  async execute(ctx) {
    if (!ctx.client.ownerIds.includes(ctx.authorId)) return;

    const message = await ctx.send("Refreshing user apps...");
    ctx.setVar("isuserappsalreadysetup", "no");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await ctx.client.services.slash?.syncAll?.();
    ctx.setVar("isuserappsalreadysetup", "yes");
    await message.edit("Successfully refreshed user apps!");
  },
};
