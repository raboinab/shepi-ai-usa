#!/bin/bash
# Test the check-subscription endpoint for raboinab@gmail.com

# Get a session token by logging in via browser, then extract from localStorage
# For now, let's check the function logs

echo "Checking Supabase function logs for check-subscription..."
supabase functions logs check-subscription --project-ref mdgmessqbfebrbvjtndz --tail 20
