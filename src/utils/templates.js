"use strict";

/**
 * Replaces legacy `<placeholder>` tokens used by welcomer/leave/leveling
 * messages. Unknown tokens are left untouched.
 */
function applyTemplate(template, values) {
  let output = String(template ?? "");
  for (const [key, value] of Object.entries(values)) {
    output = output.split(key).join(value ?? "");
  }
  return output;
}

module.exports = { applyTemplate };
