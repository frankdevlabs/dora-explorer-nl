#!/usr/bin/env bash
# Build the static export and publish it to the nginx docroot for
# https://dora.mrfrank.dev. Run from the repo root. Requires sudo.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build
sudo rsync -a --delete out/ /var/www/dora.mrfrank.dev/
sudo nginx -t
sudo systemctl reload nginx
echo "deployed: https://dora.mrfrank.dev"
