"use strict";

const VOLUNTEER_GUILD_ID = "859910344393883710";
const ARCHIVE_ROLE_ID = "1319501912638226543";
const ARCHIVE_CATEGORY_ID = "1550896740096548894";

module.exports = {
  name: "archive",
  info: {
    description: "Archive the current channel with an optional reason",
    perms: ["`Role: 1319501912638226543`"],
  },
  async execute(ctx) {
    if (ctx.guild?.id !== VOLUNTEER_GUILD_ID) return;

    if (!ctx.member?.roles?.cache?.has(ARCHIVE_ROLE_ID)) {
      const embed = ctx.embed("You do not have the required role to archive this channel.", {
        title: "Missing Permissions",
        color: "#FF0000",
      });
      return ctx.send({ embeds: [embed] });
    }

    const reason = ctx.rawArgs;
    const description = reason === "" ? "If you would like this reopened, please ping ( <@!784527187453542440> )" : reason;

    await ctx.send({
      embeds: [
        ctx.embed(description, {
          title: "Channel Archived",
          color: "#00d8ff",
          timestamp: true,
        }),
      ],
    });

    await ctx.channel.setParent(ARCHIVE_CATEGORY_ID, { lockPermissions: false });
    await ctx.services.checkins.cancelChannel(ctx.channelId);
  },
};
