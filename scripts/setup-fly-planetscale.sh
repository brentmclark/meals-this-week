#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v flyctl >/dev/null 2>&1; then
  echo "Error: flyctl is not installed. Install first: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

if [[ ! -f fly.toml ]]; then
  echo "Error: fly.toml not found. Run this script from the project repo."
  exit 1
fi

if ! flyctl auth whoami >/dev/null 2>&1; then
  echo "Error: You are not logged in to Fly. Run: flyctl auth login"
  exit 1
fi

DEFAULT_APP="$(awk -F'"' '/^app\s*=/{print $2; exit}' fly.toml)"
DEFAULT_REGION="$(awk -F'"' '/^primary_region\s*=/{print $2; exit}' fly.toml)"
DEFAULT_APP="${DEFAULT_APP:-meals-this-week}"
DEFAULT_REGION="${DEFAULT_REGION:-ord}"

echo "Setting up Fly + external Postgres for this app."
echo ""

read -r -p "Fly app name [${DEFAULT_APP}]: " APP_NAME
APP_NAME="${APP_NAME:-$DEFAULT_APP}"

read -r -p "Fly org slug [personal]: " ORG_SLUG
ORG_SLUG="${ORG_SLUG:-personal}"

read -r -p "Primary region [${DEFAULT_REGION}]: " REGION
REGION="${REGION:-$DEFAULT_REGION}"

# Keep fly.toml aligned with selected app/region.
if [[ -n "$APP_NAME" ]]; then
  sed -i.bak -E "s/^app = \".*\"/app = \"${APP_NAME}\"/" fly.toml
fi
if [[ -n "$REGION" ]]; then
  sed -i.bak -E "s/^primary_region = \".*\"/primary_region = \"${REGION}\"/" fly.toml
fi
rm -f fly.toml.bak

if flyctl status -a "$APP_NAME" >/dev/null 2>&1; then
  echo "Fly app '$APP_NAME' already exists."
else
  echo "Creating Fly app '$APP_NAME' in org '$ORG_SLUG'..."
  flyctl apps create "$APP_NAME" --org "$ORG_SLUG"
fi

echo ""
echo "Enter secrets and config values (press Enter to accept defaults)."

read -r -p "PlanetScale DATABASE_URL: " DATABASE_URL
if [[ -z "$DATABASE_URL" ]]; then
  echo "Error: DATABASE_URL is required."
  exit 1
fi

read -r -s -p "App passcode (plain text, will be hashed): " PLAIN_PASSCODE
echo ""
if [[ -z "$PLAIN_PASSCODE" ]]; then
  echo "Error: passcode is required."
  exit 1
fi

if command -v shasum >/dev/null 2>&1; then
  FAMILY_PASSCODE_HASH="$(printf '%s' "$PLAIN_PASSCODE" | shasum -a 256 | awk '{print $1}')"
else
  FAMILY_PASSCODE_HASH="$(printf '%s' "$PLAIN_PASSCODE" | openssl dgst -sha256 -r | awk '{print $1}')"
fi
unset PLAIN_PASSCODE

read -r -s -p "SESSION_SECRET (leave blank to auto-generate): " SESSION_SECRET
echo ""
if [[ -z "$SESSION_SECRET" ]]; then
  SESSION_SECRET="$(openssl rand -hex 32)"
fi

read -r -s -p "CRON_SECRET (leave blank to auto-generate): " CRON_SECRET
echo ""
if [[ -z "$CRON_SECRET" ]]; then
  CRON_SECRET="$(openssl rand -hex 32)"
fi

read -r -p "DEFAULT_HOUSEHOLD_NAME [Home]: " DEFAULT_HOUSEHOLD_NAME
DEFAULT_HOUSEHOLD_NAME="${DEFAULT_HOUSEHOLD_NAME:-Home}"

read -r -p "DEFAULT_USER_NAME [Family]: " DEFAULT_USER_NAME
DEFAULT_USER_NAME="${DEFAULT_USER_NAME:-Family}"

read -r -p "DEFAULT_USER_EMAIL [family@example.com]: " DEFAULT_USER_EMAIL
DEFAULT_USER_EMAIL="${DEFAULT_USER_EMAIL:-family@example.com}"

echo ""
echo "Setting Fly secrets..."
flyctl secrets set -a "$APP_NAME" \
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$SESSION_SECRET" \
  FAMILY_PASSCODE_HASH="$FAMILY_PASSCODE_HASH" \
  DEFAULT_HOUSEHOLD_NAME="$DEFAULT_HOUSEHOLD_NAME" \
  DEFAULT_USER_NAME="$DEFAULT_USER_NAME" \
  DEFAULT_USER_EMAIL="$DEFAULT_USER_EMAIL" \
  CRON_SECRET="$CRON_SECRET"

echo ""
echo "Deploying to Fly..."
flyctl deploy -a "$APP_NAME"

echo ""
echo "Done. Useful checks:"
echo "  flyctl status -a $APP_NAME"
echo "  flyctl logs -a $APP_NAME"
echo "  flyctl secrets list -a $APP_NAME"
