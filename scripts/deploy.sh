#!/usr/bin/env bash
# Build the web app and publish it to the nginx root, then restart the API.
# Usage: WEB_ROOT=/usr/share/nginx/meridianstudios.org npm run deploy
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/usr/share/nginx/meridianstudios.org}"
PM2_NAME="${PM2_NAME:-meridian-api}"

cd "$ROOT"
npm run build

install -d "$WEB_ROOT"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$ROOT/apps/web/dist/" "$WEB_ROOT/"
else
  find "$WEB_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a "$ROOT/apps/web/dist/." "$WEB_ROOT/"
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" || pm2 start "$ROOT/apps/api/server.js" --name "$PM2_NAME" --cwd "$ROOT/apps/api"
fi

echo "Deployed web build to $WEB_ROOT"
