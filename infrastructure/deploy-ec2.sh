#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/kerita-backend}"
BRANCH="${DEPLOY_BRANCH:-feat/aws-self-hosted-backend}"

cd "$APP_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
LOCAL_REVISION="$(git rev-parse HEAD 2>/dev/null || true)"
REMOTE_REVISION="$(git rev-parse "origin/$BRANCH")"
if [[ "$LOCAL_REVISION" == "$REMOTE_REVISION" && "${FORCE_DEPLOY:-0}" != "1" ]]; then
  exit 0
fi
git pull --ff-only origin "$BRANCH"
npm ci --omit=dev
npm run migrate
pm2 startOrReload ecosystem.config.js --env production
pm2 save
