#!/usr/bin/env bash
set -euo pipefail
cd /var/www/apswiftly
git pull origin main
npm install --omit=dev
sudo systemctl restart apswiftly
