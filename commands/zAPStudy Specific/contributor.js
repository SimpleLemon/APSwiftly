"use strict";

const { ChannelType } = require("discord.js");

const CONTRIBUTOR_CATEGORY_ID = "1356279309169328158";
const STAFF_ROLE_ID = "1519016533005832332";

const STAFF_LINES = [
  "Derek Chen (Founder) | <@!784527187453542440>",
  "Tristan Lee (Director) | <@!1199894139446247526>",
  "Ryon Tom (Manager) | <@!1226697393219567657>",
  "Max F. (Asst. Manager) | <@!1501045455386312804>",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  name: "contributor",
  info: {
    description: "Create a Channel with a contributor",
    perms: ["`SendMessages,ManageChannels`"],
  },
  async execute(ctx) {
    if (!ctx.isAdministrator()) {
      const embed = ctx.embed("You are missing `Administrator` permissions needed to run this command!", {
        title: "Missing Permissions",
        color: "#FF0000",
      });
      return ctx.send({ embeds: [embed] });
    }

    if (!ctx.arg(1) || !ctx.mentioned) {
      const embed = ctx.embed("**Usage:**\n`contributor [user] [channel name]`", {
        title: "Incorrect Usage",
        color: "#FF0000",
      });
      return ctx.send({ embeds: [embed] });
    }

    try {
      const target = ctx.mentioned;
      const channel = await ctx.guild.channels.create({
        name: ctx.arg(2),
        type: ChannelType.GuildText,
        parent: CONTRIBUTOR_CATEGORY_ID,
      });

      await wait(2000);
      await channel.permissionOverwrites.edit(STAFF_ROLE_ID, { ViewChannel: true });
      await channel.permissionOverwrites.edit(target.id, { ViewChannel: true });

      await channel.send({
        content: `Hello <@!${target.id}>`,
        embeds: [ctx.embed(STAFF_LINES.join("\n"), { color: "#7dfdff" })],
      });

      await ctx.send({
        embeds: [
          ctx.embed(`<@!${ctx.authorId}> has added <@!${target.id}> to <#${channel.id}>`, {
            title: "Success!",
            color: "#00FF00",
          }),
        ],
      });
    } catch {
      const embed = ctx.embed("Please try again later.", {
        title: "Something went wrong!",
        color: "#FF0000",
      });
      await ctx.send({ embeds: [embed] });
    }
  },
};
