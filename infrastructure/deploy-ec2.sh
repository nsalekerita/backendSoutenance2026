#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/kerita-backend}"
BRANCH="${DEPLOY_BRANCH:-feat/aws-self-hosted-backend}"

cd "$APP_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
npm ci --omit=dev
npm run migrate
pm2 reload ecosystem.config.js --env production
pm2 save
