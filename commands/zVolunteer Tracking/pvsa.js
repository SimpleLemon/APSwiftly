"use strict";
module.exports = { name: "pvsa", info: { description: "Official President’s Volunteer Service Award status." },
 cooldown: { time: 3000 }, async execute(ctx) {
  return ctx.reply({ embeds: [ctx.embed("The program announced a pause effective May 27, 2025. Check the [official PVSA website](https://presidentialserviceawards.gov/) for current availability and requirements. APStudy volunteer-hour tracking remains available.", { title: "PVSA Program Status", color: "Gold" })] });
} };
