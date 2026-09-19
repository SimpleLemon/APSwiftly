"use strict";

const STAGES = [
  "Searching for Askers... (5%)",
  "Searching for Askers... (15%)",
  "Searching for Askers... (40%)",
  "Searching for Askers... (60%)",
  "Searching for Askers... (90%)",
  "Searching for Askers... (100%)",
  "No askers has been found.",
];

module.exports = {
  name: "whoasked",
  info: {
    description: "Searches for Askers (although mostly useless).",
    perms: ["`SendMessages`"],
  },
  cooldown: {
    time: 3000,
    message: "Slow down! Don't spam the command!\nTime remaining: %timestamp%",
  },
  async execute(ctx) {
    const sent = await ctx.send("Searching for Askers... (0%)");

    STAGES.forEach((text, index) => {
      setTimeout(() => {
        sent.edit({ content: text }).catch(() => {});
      }, 5000 * (index + 1));
    });
  },
};
