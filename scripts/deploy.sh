#!/usr/bin/env bash
# Build the web app, publish it to the nginx document root, and reload the API.
#
# Usage:
#   WEB_ROOT=/usr/share/nginx/meridianstudios.org npm run deploy
#
# Environment:
#   WEB_ROOT               nginx document root
#                          (default: /usr/share/nginx/meridianstudios.org)
#   PM2_NAME               PM2 process name (default: meridian-backend)
#   PORT                   API port used by the health check (default: 2000)
#   ALLOW_CUSTOM_WEB_ROOT  set to 1 to allow a WEB_ROOT without "meridianstudios"
#
# The API is managed by deploy/pm2/ecosystem.config.cjs. If the live PM2
# process still points at the pre-monorepo script, this script recreates it from
# that config after the syntax checks pass.
#
# This is the manual host-deploy counterpart to .github/workflows/deploy.yml.
# nginx is the only public listener; this script never edits nginx config and
# never invokes sudo.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "${WEB_ROOT+x}" = "x" ] && [ -z "$WEB_ROOT" ]; then
  echo "error: WEB_ROOT is set but empty" >&2
  exit 1
fi
WEB_ROOT="${WEB_ROOT:-/usr/share/nginx/meridianstudios.org}"
WEB_ROOT="${WEB_ROOT%/}"

if [ -z "$WEB_ROOT" ] || [ "$WEB_ROOT" = "/" ]; then
  echo "error: refusing to deploy to the filesystem root" >&2
  exit 1
fi
if [ "${ALLOW_CUSTOM_WEB_ROOT:-0}" != "1" ] && [[ "$WEB_ROOT" != *meridianstudios* ]]; then
  echo "error: WEB_ROOT ($WEB_ROOT) does not look like the Meridian web root." >&2
  echo "       Set ALLOW_CUSTOM_WEB_ROOT=1 if this is intentional." >&2
  exit 1
fi

PM2_NAME="${PM2_NAME:-meridian-backend}"
API_PORT="${PORT:-2000}"
DIST="$ROOT/apps/web/dist"
STAGE=""
BACKUP=""
BACKUP_CREATED=0
METHOD="rsync"

cleanup() {
  if [ -n "$STAGE" ]; then
    rm -rf "$STAGE"
  fi
}
trap cleanup EXIT

cd "$ROOT"

echo "==> Building web app"
npm run build

if [ ! -f "$DIST/index.html" ]; then
  echo "error: build did not produce $DIST/index.html" >&2
  exit 1
fi

STAGE="$(mktemp -d)"
cp -a "$DIST/." "$STAGE/"
if [ ! -f "$STAGE/index.html" ]; then
  echo "error: staged build is missing index.html" >&2
  exit 1
fi

PM2_AVAILABLE=0
if command -v pm2 >/dev/null 2>&1; then
  PM2_AVAILABLE=1
  EXPECTED_SCRIPT="$(cd "$ROOT/apps/api" && pwd -P)/server.js"
  ECOSYSTEM="$ROOT/deploy/pm2/ecosystem.config.cjs"

  echo "==> Checking API and PM2 config syntax"
  node --check "$EXPECTED_SCRIPT"
  if [ ! -f "$ECOSYSTEM" ]; then
    echo "error: PM2 ecosystem config not found at $ECOSYSTEM" >&2
    exit 1
  fi
  node --check "$ECOSYSTEM"
fi

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$WEB_ROOT.backup-$TIMESTAMP"

echo "==> Publishing build to $WEB_ROOT"
install -d "$(dirname "$WEB_ROOT")"
if command -v rsync >/dev/null 2>&1; then
  if [ -d "$WEB_ROOT" ] && [ -n "$(ls -A "$WEB_ROOT" 2>/dev/null)" ]; then
    cp -a "$WEB_ROOT" "$BACKUP"
    BACKUP_CREATED=1
  fi
  install -d "$WEB_ROOT"
  if ! rsync -a --delete --delay-updates "$STAGE/" "$WEB_ROOT/"; then
    echo "error: rsync failed; the live site may be partially updated." >&2
    if [ "$BACKUP_CREATED" = "1" ]; then
      echo "restore it with: rsync -a --delete '$BACKUP/' '$WEB_ROOT/'" >&2
    fi
    exit 1
  fi
else
  echo "rsync not found; swapping directories instead"
  METHOD="swap"
  NEW_ROOT="$WEB_ROOT.new-$TIMESTAMP"
  rm -rf "$NEW_ROOT"
  install -d "$NEW_ROOT"
  cp -a "$STAGE/." "$NEW_ROOT/"
  if [ -e "$WEB_ROOT" ]; then
    mv "$WEB_ROOT" "$BACKUP"
    BACKUP_CREATED=1
  fi
  if ! mv "$NEW_ROOT" "$WEB_ROOT"; then
    echo "error: directory swap failed; restoring the previous root" >&2
    if [ "$BACKUP_CREATED" = "1" ]; then
      mv "$BACKUP" "$WEB_ROOT"
    fi
    exit 1
  fi
fi

if [ "$PM2_AVAILABLE" = "1" ]; then
  CURRENT_SCRIPT="$(
    pm2 jlist 2>/dev/null | node -e '
      let raw = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => { raw += chunk; });
      process.stdin.on("end", () => {
        try {
          const proc = JSON.parse(raw).find((entry) => entry.name === process.argv[1]);
          process.stdout.write((proc && proc.pm2_env && proc.pm2_env.pm_exec_path) || "");
        } catch {
          process.stdout.write("");
        }
      });
    ' "$PM2_NAME" || true
  )" || true

  if [ "$CURRENT_SCRIPT" = "$EXPECTED_SCRIPT" ]; then
    echo "==> Reloading PM2 process $PM2_NAME"
    NODE_ENV=production HOST=127.0.0.1 PORT="$API_PORT" TRUST_PROXY=1 \
      pm2 reload "$PM2_NAME" --update-env \
      || NODE_ENV=production HOST=127.0.0.1 PORT="$API_PORT" TRUST_PROXY=1 \
        pm2 restart "$PM2_NAME" --update-env
  else
    if [ -n "$CURRENT_SCRIPT" ]; then
      echo "==> Migrating PM2 process $PM2_NAME (was: $CURRENT_SCRIPT)"
    else
      echo "==> Starting PM2 process $PM2_NAME from $ECOSYSTEM"
    fi
    if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
      pm2 delete "$PM2_NAME"
    fi
    pm2 start "$ECOSYSTEM" --only "$PM2_NAME" --env production
  fi

  echo "==> Waiting for http://127.0.0.1:${API_PORT}/api/health"
  HEALTHY=0
  for _ in $(seq 1 20); do
    CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 2 \
      "http://127.0.0.1:${API_PORT}/api/health" 2>/dev/null || true)"
    if [ "$CODE" = "200" ]; then
      HEALTHY=1
      break
    fi
    sleep 1
  done
  if [ "$HEALTHY" != "1" ]; then
    echo "error: API health check did not return 200 within 20s." >&2
    echo "       Inspect with: pm2 logs '$PM2_NAME'" >&2
    exit 1
  fi

  if ! pm2 save >/dev/null 2>&1; then
    echo "warning: pm2 save failed; the process may not be restored after reboot" >&2
  fi
else
  echo "pm2 not found; skipped API reload and health check" >&2
fi

echo
echo "Deployed web build to $WEB_ROOT"
if [ "$BACKUP_CREATED" = "1" ]; then
  echo "Backup retained at: $BACKUP"
  echo "Rollback:"
  if [ "$METHOD" = "swap" ]; then
    echo "  rm -rf '$WEB_ROOT' && mv '$BACKUP' '$WEB_ROOT'"
  else
    echo "  rsync -a --delete '$BACKUP/' '$WEB_ROOT/'"
  fi
  echo "  pm2 reload '$PM2_NAME' --update-env"
  echo "  # once the deploy is confirmed good: rm -rf '$BACKUP'"
else
  echo "No previous web root existed, so there is no web build to roll back to."
  echo "Rollback (API only):"
  echo "  pm2 reload '$PM2_NAME' --update-env"
fi
