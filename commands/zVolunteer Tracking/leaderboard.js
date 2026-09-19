"use strict";

module.exports = {
  name: "rich",
  aliases: ["leaderboard", "lb"],
  info: {
    description: "View the volunteer hours leaderboard.",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 5000,
    message: "Be Patient\nPlease wait for %time% to do this command again!",
  },
  async execute(ctx) {
    try {
      const entries = ctx.db.listGlobalUserVars("hours", "custom", "desc", 10);
      const lines = [];
      let position = 0;

      for (const entry of entries) {
        const user = await ctx.client.users.fetch(entry.id).catch(() => null);
        if (!user) continue;
        position += 1;
        lines.push(`\`${position}. \` <@!${user.id}> • **${entry.value}** hours.`);
      }

      const embed = ctx.embed(lines.join("\n"), {
        title: "Volunteering Leaderboard",
        color: "#00ccf0",
      });
      await ctx.reply({ embeds: [embed] });
    } catch {
      const embed = ctx.embed("Something went wrong.", {
        title: "Error",
        color: "#FF2D00",
      });
      await ctx.send({ embeds: [embed] });
    }
  },
};
