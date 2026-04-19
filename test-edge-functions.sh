#!/bin/bash

# Test all 13 Edge Functions
BASE_URL="https://klccgigaedojxdpnkjcd.supabase.co/functions/v1"

echo "=========================================="
echo "Testing All 13 Supabase Edge Functions"
echo "=========================================="
echo ""

# 1. submit-contact (no auth required)
echo "1. Testing submit-contact..."
curl -s -X POST "$BASE_URL/submit-contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test"}' \
  -w "\nStatus: %{http_code}\n\n"

# 2. check-subscription (requires auth)
echo "2. Testing check-subscription (requires auth)..."
curl -s -X POST "$BASE_URL/check-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -w "\nStatus: %{http_code}\n\n"

# 3. create-checkout (requires auth)
echo "3. Testing create-checkout (requires auth)..."
curl -s -X POST "$BASE_URL/create-checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"planType":"monthly"}' \
  -w "\nStatus: %{http_code}\n\n"

# 4. customer-portal (requires auth)
echo "4. Testing customer-portal (requires auth)..."
curl -s -X POST "$BASE_URL/customer-portal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -w "\nStatus: %{http_code}\n\n"

# 5. create-project-sheet (requires auth)
echo "5. Testing create-project-sheet (requires auth)..."
curl -s -X POST "$BASE_URL/create-project-sheet" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"projectId":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# 6. sync-sheet (requires auth)
echo "6. Testing sync-sheet (requires auth)..."
curl -s -X POST "$BASE_URL/sync-sheet" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"projectId":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# 7. orchestrator-webhook (webhook endpoint)
echo "7. Testing orchestrator-webhook..."
curl -s -X POST "$BASE_URL/orchestrator-webhook" \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' \
  -w "\nStatus: %{http_code}\n\n"

# 8. extract-document-text (requires auth)
echo "8. Testing extract-document-text (requires auth)..."
curl -s -X POST "$BASE_URL/extract-document-text" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"documentId":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# 9. process-statement (requires auth)
echo "9. Testing process-statement (requires auth)..."
curl -s -X POST "$BASE_URL/process-statement" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"documentId":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# 10. docuclipper-webhook (webhook endpoint)
echo "10. Testing docuclipper-webhook..."
curl -s -X POST "$BASE_URL/docuclipper-webhook" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# 11. validate-adjustment-proof (requires auth)
echo "11. Testing validate-adjustment-proof (requires auth)..."
curl -s -X POST "$BASE_URL/validate-adjustment-proof" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"adjustmentId":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# 12. insights-chat (requires auth)
echo "12. Testing insights-chat (requires auth)..."
curl -s -X POST "$BASE_URL/insights-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"message":"test","projectId":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# 13. stripe-webhook (webhook endpoint)
echo "13. Testing stripe-webhook..."
curl -s -X POST "$BASE_URL/stripe-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "=========================================="
echo "Test Summary:"
echo "- Status 200 = Working correctly"
echo "- Status 401 = Auth required (expected)"
echo "- Status 400 = Bad request (function working, needs valid data)"
echo "- Status 500 = Server error (needs investigation)"
echo "=========================================="
