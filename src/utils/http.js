"use strict";

const axios = require("axios");

/**
 * Mirrors the `$httpRequest[url;method;body;headers;error]` helper used by
 * entertainment commands. Returns parsed JSON body or `undefined` on failure
 * (the legacy `dead` error mode silently aborted).
 */
async function httpJson(url, options = {}) {
  try {
    const response = await axios.request({
      url,
      method: options.method ?? "GET",
      data: options.body,
      headers: options.headers,
      timeout: options.timeout ?? 15000,
      validateStatus: (status) => status >= 200 && status < 300,
    });
    return response.data;
  } catch {
    return undefined;
  }
}

module.exports = { httpJson };
