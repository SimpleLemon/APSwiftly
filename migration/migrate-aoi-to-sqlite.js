"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { migrate } = require("../src/migration/migrate");

function parseArgs(argv) {
  const args = { source: null, dest: null, report: null, dryRun: false, allowExisting: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--source" || arg === "-s") args.source = argv[++i];
    else if (arg === "--dest" || arg === "-d") args.dest = argv[++i];
    else if (arg === "--report" || arg === "-r") args.report = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--allow-existing") args.allowExisting = true;
    else if (arg === "--no-overwrite") args.allowExisting = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.source ?? process.env.AOI_DB_PATH ?? path.join(__dirname, "..", "database");
  const dest = args.dest ?? path.join(__dirname, "..", "database", "apswiftly.sqlite");

  const report = migrate({
    sourcePath: source,
    destinationPath: dest,
    dryRun: args.dryRun,
    allowExisting: args.allowExisting,
  });

  const reportPath = args.report ?? path.join(__dirname, "..", ".migration", "migration-report.json");
  if (!args.dryRun) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  console.log(JSON.stringify(report, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

module.exports = { parseArgs, main };
