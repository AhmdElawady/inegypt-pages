#!/bin/sh
# Copy the app's bundled legal pages (the source of truth) into src/legal/ (Plan 47 §10.1).
# Run locally when the app's privacy/terms change; the copies are committed so CI can build without the app repo.
set -eu
APP="${INEGYPT_APP_REPO:-$HOME/Desktop/InEgyptUI}"
for f in privacy terms; do
  cp "$APP/InEgypt/Resources/$f.html" "src/legal/$f.bundled.html"
  echo "synced src/legal/$f.bundled.html"
done
