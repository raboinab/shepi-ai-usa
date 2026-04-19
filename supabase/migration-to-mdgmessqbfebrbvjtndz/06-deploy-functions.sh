#!/usr/bin/env bash
# Deploy every edge function in supabase/functions/ to the new project.
# Run: bash 06-deploy-functions.sh
set -euo pipefail

PROJECT_REF="mdgmessqbfebrbvjtndz"
FUNCTIONS_DIR="$(dirname "$0")/../functions"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Install Supabase CLI: brew install supabase/tap/supabase" >&2
  exit 1
fi

echo "==> Logging in (if not already)"
supabase login || true

echo "==> Linking project"
supabase link --project-ref "$PROJECT_REF"

cd "$FUNCTIONS_DIR"
deployed=0
failed=0

for dir in */; do
  name="${dir%/}"
  # Skip _shared and any non-function dirs
  [[ "$name" =~ ^_ ]] && continue
  [[ ! -f "$dir/index.ts" ]] && continue

  echo "==> Deploying $name"
  if supabase functions deploy "$name" --project-ref "$PROJECT_REF"; then
    ((deployed++))
  else
    ((failed++))
    echo "    FAILED: $name" >&2
  fi
done

echo
echo "Done. deployed=$deployed failed=$failed"
