"use strict";

module.exports = {
  name: "cite",
  info: {
    description: "Cite Images Information",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!",
  },
  async execute(ctx) {
    const embed = ctx.embed(
      [
        "**Requirement:** Cite all images not owned/created by yourself.",
        "**Format:** Roboto (Size 10) - Gray color",
        "",
        "**Tips:**",
        "Copy previously [done](https://docs.google.com/document/d/1DyojO1kPa0JnBJFKYgDD80bai1WxiWshHC3QAZioqS4/view) citations and change it to match the source you used.",
        "",
        "",
      ].join("\n"),
      {
        title: "How to Cite Images",
        color: "#FFD700",
      }
    ).setImage("https://i.imgur.com/XoKlqpk.png");

    await ctx.reply({ embeds: [embed] });
  },
};
