#!/usr/bin/env bash
# Re-enable Video Speed Controller after Safari restarts (unsigned / temporary installs).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$HOME/Applications/Video Speed Controller.app"
DIST_SAFARI="$ROOT/dist-safari"

echo "Video Speed Controller — Safari re-enable"
echo

# Temporary extensions and "Allow Unsigned Extensions" both reset when Safari quits.
# This script only prepares files / opens the right UI; you must click Enable yourself.

if [[ ! -f "$DIST_SAFARI/manifest.json" ]]; then
  echo "Building dist-safari…"
  export PATH="${HOME}/.local/node/bin:${PATH}"
  (cd "$ROOT" && npm run build:safari:temp)
fi

# Host app must not be running or Safari may refuse temporary add / enable clicks.
pkill -x "Video Speed Controller" 2>/dev/null || true

echo "IMPORTANT: enabling the extension is not enough."
echo "           Set Website Access → All Websites or it will not run on YouTube/any site."
echo
echo "Two options after Safari opens:"
echo
echo "A) Host app (recommended for daily use)"
echo "   1. Develop → Allow Unsigned Extensions"
echo "   2. Settings → Extensions → enable Video Speed Controller"
echo "   3. Website Access → All Websites   ← required"
echo "   4. Reload the video tab"
echo
echo "B) Temporary folder (gone again when Safari quits)"
echo "   1. Settings → Developer → Add Temporary Extension…"
echo "   2. Select: $DIST_SAFARI"
echo "   3. Website Access → All Websites   ← required"
echo
echo "If Safari says clicking was interfered with: quit Wispr Flow / Cold Turkey, then retry."
echo

open -a Safari
sleep 1
if [[ -d "$APP" ]]; then
  open "$APP"
fi
open "$DIST_SAFARI"
