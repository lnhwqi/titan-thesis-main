#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
BRANCH="${2:-}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: bash ./devops/deploy/ec2-deploy.sh <staging|production> [branch]"
  exit 1
fi

COMPOSE_FILE=""
STATIC_ENV_FILE=""
DEFAULT_BRANCH=""

case "$TARGET" in
  staging)
    COMPOSE_FILE="./devops/deploy/docker-compose.staging.yml"
    STATIC_ENV_FILE="/etc/titan/staging.env"
    DEFAULT_BRANCH="staging"
    ;;
  production)
    COMPOSE_FILE="./devops/deploy/docker-compose.production.yml"
    STATIC_ENV_FILE="/etc/titan/production.env"
    DEFAULT_BRANCH="main"
    ;;
  *)
    echo "Invalid target: $TARGET. Expected staging or production."
    exit 1
    ;;
esac

if [[ -z "$BRANCH" ]]; then
  BRANCH="$DEFAULT_BRANCH"
fi

echo "==> Deploy target: $TARGET"
echo "==> Branch: $BRANCH"

git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if [[ -f "$STATIC_ENV_FILE" ]]; then
  echo "==> Loading static env: $STATIC_ENV_FILE"
  set -a
  source "$STATIC_ENV_FILE"
  set +a
else
  echo "==> Static env file not found at $STATIC_ENV_FILE"
  echo "==> Continuing with current shell environment"
fi

docker compose -f "$COMPOSE_FILE" config > /dev/null
docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans
docker image prune -f

echo "==> Deployment completed for $TARGET"
