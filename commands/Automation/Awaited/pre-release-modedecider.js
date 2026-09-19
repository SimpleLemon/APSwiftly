"use strict";

module.exports = [
  {
    event: "ready",
    once: true,
    async execute(ctx) {
      const { client } = ctx;
      const releaseType = String(client.db.getVar("release_type") ?? "Stable");
      const target = client.db.getVar("DevReleaseTypeToSet") ?? "Pre-release";
      if (String(client.db.getVar("pre_release")) === "on") {
        if (!releaseType.includes(target)) client.db.setVar("release_type", target);
      } else if (releaseType.includes("Stable") === false) {
        client.db.deleteVar("release_type");
      }
    },
  },
];
