"use strict";
module.exports = { event: "alwaysExecute", execute: ctx => ctx.services.leveling.onMessage(ctx) };
