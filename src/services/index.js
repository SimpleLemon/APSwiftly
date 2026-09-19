"use strict";

const { Scheduler } = require("../db/scheduler");
const { Cooldowns } = require("../db/cooldowns");
const { LevelingService } = require("./leveling");
const hours = require("./hours");
const logging = require("./logging");
const welcomer = require("./welcomer");
const { renderMath } = require("./renderMath");
const { createErrorReporter } = require("./errorReporter");
const { SlashService } = require("./slashRegistry");

function createServices(client, { logger, sqlite }) {
  const services = {
    cooldowns: new Cooldowns({ sqlite }),
    scheduler: new Scheduler({ sqlite, logger: logger.child("[scheduler]") }),
    logging,
    hours,
    welcomer,
    renderMath: (channel, options) => renderMath(channel, options),
    slash: new SlashService(client),
  };

  services.checkins = new (require("./checkins").CheckinService)(client);
  services.leveling = new LevelingService(client);
  services.errorReporter = createErrorReporter(client, { logger });

  return services;
}

module.exports = { createServices };
