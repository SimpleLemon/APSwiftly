"use strict";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

function createLogger({ level = "info", debug = false } = {}) {
  const threshold = LEVELS[debug ? "debug" : level] ?? LEVELS.info;

  const logger = {
    debug: (...args) => threshold <= LEVELS.debug && console.debug("[debug]", ...args),
    log: (...args) => threshold <= LEVELS.info && console.log(...args),
    info: (...args) => threshold <= LEVELS.info && console.log(...args),
    warn: (...args) => threshold <= LEVELS.warn && console.warn("[warn]", ...args),
    error: (...args) => threshold <= LEVELS.error && console.error("[error]", ...args),
    child(prefix) {
      return {
        debug: (...args) => logger.debug(prefix, ...args),
        log: (...args) => logger.log(prefix, ...args),
        info: (...args) => logger.info(prefix, ...args),
        warn: (...args) => logger.warn(prefix, ...args),
        error: (...args) => logger.error(prefix, ...args),
      };
    },
  };

  return logger;
}

module.exports = { createLogger, LEVELS };
