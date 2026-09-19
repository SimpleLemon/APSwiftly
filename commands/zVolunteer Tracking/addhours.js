"use strict";

const { addHours } = require("../../src/services/hours");

const VOLUNTEER_GUILD_ID = "859910344393883710";
const STAFF_ROLE_ID = "1519016533005832332";

module.exports = {
  name: "addhours",
  aliases: ["hoursadd"],
  info: {
    description: "Add volunteer hours to user.",
    perms: ["`Administrator`", "`Role: 1519016533005832332`"],
  },
  async execute(ctx) {
    if (ctx.guild?.id !== VOLUNTEER_GUILD_ID) {
      return ctx.send("You tried.");
    }

    if (!ctx.isAdministrator() && !ctx.member?.roles?.cache?.has(STAFF_ROLE_ID)) {
      const embed = ctx.embed(`You need \`Administrator\` or the <@&${STAFF_ROLE_ID}> role to run this command.`, {
        title: "Missing Permissions",
        color: "#FF0000",
      });
      return ctx.send({ embeds: [embed] });
    }

    if (!ctx.arg(1)) {
      const embed = ctx.embed("Please enter a valid number.", {
        title: "Incorrect Usage",
        color: "#FF0000",
      });
      return ctx.send({ embeds: [embed] });
    }

    const usage = () =>
      ctx.embed("**Usage:**\n`addhours [user] [amount]`", {
        title: "Incorrect Usage",
        color: "#FF0000",
      });

    try {
      const target = ctx.mentioned;
      const amountArg = ctx.arg(2);
      const amount = Number(amountArg);

      if (!target || !amountArg || !Number.isFinite(amount)) {
        return ctx.send({ embeds: [usage()] });
      }

      const newTotal = await addHours(ctx.client, {
        targetUserId: target.id,
        amount,
        actorId: ctx.authorId,
      });

      const embed = ctx.embed(`<@!${ctx.authorId}> added ${amountArg} hours to <@!${target.id}>. They now have \`${newTotal}\` hours.`, {
        title: "<a:tada:1324589971746586714> Volunteer Hours Added",
        color: "#00ff00",
      });
      await ctx.reply({ embeds: [embed] });
    } catch {
      await ctx.send({ embeds: [usage()] });
    }
  },
};
