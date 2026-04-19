#!/bin/bash

# Supabase Secrets Setup Script
# This script helps you configure all required secrets for your Edge Functions

set -e

PROJECT_REF="klccgigaedojxdpnkjcd"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}=========================================="
echo "Supabase Secrets Setup"
echo "Project: $PROJECT_REF"
echo -e "==========================================${NC}\n"

# Function to set a secret
set_secret() {
    local secret_name=$1
    local description=$2
    local required=$3
    local example=$4
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}Secret: ${YELLOW}$secret_name${NC}"
    echo -e "${description}"
    
    if [ -n "$example" ]; then
        echo -e "Example format: ${example}"
    fi
    
    if [ "$required" = "required" ]; then
        echo -e "${RED}⚠ Required${NC}"
    else
        echo -e "${GREEN}⭐ Optional${NC}"
    fi
    
    echo ""
    read -p "Enter value (or press Enter to skip): " secret_value
    
    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}⏭ Skipped${NC}\n"
        return
    fi
    
    echo "Setting secret..."
    if supabase secrets set "$secret_name=$secret_value" --project-ref "$PROJECT_REF" 2>/dev/null; then
        echo -e "${GREEN}✅ $secret_name configured successfully${NC}\n"
    else
        echo -e "${RED}❌ Failed to set $secret_name${NC}\n"
    fi
}

echo -e "${BOLD}This script will help you configure secrets for:${NC}"
echo "  • Stripe payments"
echo "  • Email notifications"
echo "  • Document processing"
echo "  • External API integrations"
echo ""
echo -e "${YELLOW}Note: Press Enter to skip any secret you don't have yet${NC}\n"
read -p "Press Enter to continue..."

# Stripe Secrets
echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BOLD}Stripe Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

set_secret "STRIPE_SECRET_KEY" \
    "Your Stripe secret key for payment processing\nGet it from: https://dashboard.stripe.com/apikeys" \
    "required" \
    "sk_live_xxxxx or sk_test_xxxxx"

set_secret "STRIPE_WEBHOOK_SECRET" \
    "Webhook secret for verifying Stripe webhook events\nGet it from: Stripe Dashboard → Webhooks → [Your endpoint]" \
    "required" \
    "whsec_xxxxx"

# Email Configuration
echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BOLD}Email Configuration (Resend)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

set_secret "RESEND_API_KEY" \
    "Resend API key for sending emails\nGet it from: https://resend.com/api-keys" \
    "optional" \
    "re_xxxxx"

# DocuClipper Configuration
echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BOLD}DocuClipper Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

set_secret "DOCUCLIPPER_API_KEY" \
    "DocuClipper API key for document processing\nGet it from your DocuClipper account settings" \
    "optional" \
    ""

set_secret "DOCUCLIPPER_API_URL" \
    "DocuClipper API base URL" \
    "optional" \
    "https://api.docuclipper.com"

set_secret "DOCUCLIPPER_WEBHOOK_SECRET" \
    "Secret for verifying DocuClipper webhooks\nGenerate a secure random string" \
    "optional" \
    ""

# Document Parser
echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BOLD}Document Parser Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

set_secret "DOCUMENT_PARSER_API_URL" \
    "Your document parser service URL" \
    "optional" \
    "https://your-parser-service.com"

# Orchestrator
echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BOLD}Orchestrator Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

set_secret "ORCHESTRATOR_WEBHOOK_SECRET" \
    "Secret for verifying orchestrator webhooks\nGenerate a secure random string" \
    "optional" \
    ""

set_secret "ORCHESTRATOR_API_KEY" \
    "API key for orchestrator service" \
    "optional" \
    ""

# Shepi Backend Services
echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BOLD}Shepi Backend Services${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

set_secret "SHEPI_POSTGRES_API_KEY" \
    "API key for Shepi PostgreSQL service" \
    "optional" \
    ""

set_secret "SHEPI_POSTGRES_API_URL" \
    "URL for Shepi PostgreSQL service" \
    "optional" \
    "https://your-postgres-api.com"

set_secret "SHEPI_SHEETS_API_KEY" \
    "API key for Shepi Sheets service" \
    "optional" \
    ""

set_secret "SHEPI_SHEETS_API_URL" \
    "URL for Shepi Sheets service" \
    "optional" \
    "https://your-sheets-api.com"

# AI Services
echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BOLD}AI Services Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

set_secret "LOVABLE_API_KEY" \
    "Lovable AI API key for AI features\nGet it from your Lovable dashboard" \
    "optional" \
    ""

# Summary
echo -e "\n${BOLD}${GREEN}=========================================="
echo "Setup Complete!"
echo -e "==========================================${NC}\n"

echo "To view all configured secrets, run:"
echo "  supabase secrets list --project-ref $PROJECT_REF"
echo ""
echo "To test your Edge Functions, run:"
echo "  ./test-edge-functions.sh"
echo ""
echo -e "${YELLOW}Note: Remember to deploy your Edge Functions after setting secrets:${NC}"
echo "  supabase functions deploy --project-ref $PROJECT_REF"
echo ""
