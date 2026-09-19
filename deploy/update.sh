#!/usr/bin/env bash
set -euo pipefail
cd /var/www/apswiftly
# Follow the checkout's configured upstream (including release branches).
git pull --ff-only
npm ci --omit=dev
npm run validate
sudo systemctl restart apswiftly

# Legacy aoi.db cutover is a separate offline operation. Never import or replace
# the live SQLite database during a routine code deployment.
