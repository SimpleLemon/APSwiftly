"use strict";

const hours = require("../zVolunteer Tracking/hours");

module.exports = {
  slash: { name: "hours" },
  info: hours.info,
  execute: hours.execute,
};
