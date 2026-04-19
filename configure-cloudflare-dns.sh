#!/bin/bash

# Cloudflare DNS Configuration for Vercel
# This script adds DNS records for shepi.ai to point to Vercel

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Cloudflare DNS Configuration for Vercel${NC}"
echo "=========================================="
echo ""

# Check if environment variables are set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Error: CLOUDFLARE_API_TOKEN environment variable is not set"
    echo "Please set it with: export CLOUDFLARE_API_TOKEN='your-api-token'"
    echo ""
    echo "To create a Cloudflare API token:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Click 'Create Token'"
    echo "3. Use 'Edit zone DNS' template"
    echo "4. Select the shepi.ai zone"
    exit 1
fi

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo "Error: CLOUDFLARE_ZONE_ID environment variable is not set"
    echo ""
    echo "To find your Zone ID:"
    echo "1. Go to https://dash.cloudflare.com"
    echo "2. Select shepi.ai domain"
    echo "3. Scroll down on Overview page to find 'Zone ID'"
    echo ""
    echo "Then set it with: export CLOUDFLARE_ZONE_ID='your-zone-id'"
    exit 1
fi

ZONE_ID="$CLOUDFLARE_ZONE_ID"
API_TOKEN="$CLOUDFLARE_API_TOKEN"

echo "Zone ID: $ZONE_ID"
echo ""

# Function to create DNS record
create_dns_record() {
    local record_type=$1
    local name=$2
    local content=$3
    local proxied=$4

    echo -e "${YELLOW}Creating $record_type record for $name -> $content${NC}"
    
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{\"type\":\"$record_type\",\"name\":\"$name\",\"content\":\"$content\",\"ttl\":1,\"proxied\":$proxied}")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Successfully created $record_type record for $name${NC}"
    else
        echo "✗ Failed to create record. Response:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
    echo ""
}

# First, let's check if records already exist and delete them
echo "Checking for existing DNS records..."
existing_records=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=A&name=shepi.ai" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")

echo "$existing_records" | jq '.result[] | {id, name, type, content}' 2>/dev/null || echo "No existing A records found or jq not installed"
echo ""

# Create DNS records for Vercel
# Note: Vercel's IP address for A records
VERCEL_IP="76.76.21.21"

echo "Adding DNS records for Vercel..."
echo ""

# Add A record for apex domain (shepi.ai)
create_dns_record "A" "shepi.ai" "$VERCEL_IP" "false"

# Add CNAME record for www subdomain
create_dns_record "CNAME" "www" "cname.vercel-dns.com" "false"

echo -e "${GREEN}DNS configuration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com/raboinab/shepi-ai-web/settings/domains"
echo "2. Add 'shepi.ai' domain"
echo "3. Add 'www.shepi.ai' domain"
echo "4. Wait for DNS propagation (usually 5-10 minutes)"
echo "5. Test with: curl -I https://shepi.ai"
