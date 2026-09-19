"use strict";

const CONTRIBUTOR_CATEGORY_ID = "1356279309169328158";
const STAFF_ROLE_ID = "1519016533005832332";

module.exports = {
  name: "grammar",
  info: {
    description: "Ask Contributor to use Grammarly",
    perms: ["`SendMessages,ManageChannels`", "`Administrator`", "`Role: 1519016533005832332`"],
  },
  async execute(ctx) {
    if (ctx.channel?.parentId !== CONTRIBUTOR_CATEGORY_ID) {
      const embed = ctx.embed("This command cannot be used here!", {
        title: "Error",
        color: "#FF0000",
      });
      return ctx.send({ embeds: [embed] });
    }

    if (!ctx.isAdministrator() && !ctx.member?.roles?.cache?.has(STAFF_ROLE_ID)) {
      const embed = ctx.embed(`You need \`Administrator\` or the <@&${STAFF_ROLE_ID}> role to run this command.`, {
        title: "Missing Permissions",
        color: "#FF0000",
      });
      return ctx.send({ embeds: [embed] });
    }

    try {
      const embed = ctx.embed(
        [
          "> To ensure readability, please use a grammar checking tool.",
          "> Below are free tools.",
          "⭐️ **Suggested:** https://www.grammarly.com/",
          "**Alternatives:**",
          "https://quillbot.com/",
          "https://prowritingaid.com/",
          "https://www.languagetool.org/",
        ].join("\n"),
        {
          title: "Grammar Checking Tools",
          color: "#00FF00",
        }
      );
      await ctx.send({ embeds: [embed] });
    } catch {
      const embed = ctx.embed("Please try again later.", {
        title: "Something went wrong!",
        color: "#FF0000",
      });
      await ctx.send({ embeds: [embed] });
    }
  },
};
