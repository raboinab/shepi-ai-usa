# Resend Email Setup Guide

## Overview
All email functionality in shepi-ai-usa now uses **Resend** instead of Lovable Cloud email services.

## Email Types & Functions

### 1. **Supabase Auth Emails** (via `auth-email-hook`)
Handles all authentication-related emails:
- ✅ Signup confirmation
- ✅ Magic link login
- ✅ Password recovery
- ✅ Email change confirmation
- ✅ User invitation
- ✅ Reauthentication

**Function**: `supabase/functions/auth-email-hook/index.ts`
**Sends from**: `shepi-ai <noreply@shepi.ai>`

### 2. **Admin Notifications** (via `notify-admin`)
- New user signups → `hello@shepi.ai`
- Demo page views → `hello@shepi.ai`
- Welcome emails to new users

**Function**: `supabase/functions/notify-admin/index.ts`
**Sends from**: `shepi Notifications <notifications@shepi.ai>`

### 3. **Engagement Emails** (via `send-engagement-email`)
Automated nurture sequence:
- Day 3: "Need help getting started?"
- Day 7: "Your deal data is waiting"
- Day 14: "Still interested in shepi?"

**Function**: `supabase/functions/send-engagement-email/index.ts`
**Sends from**: `shepi <notifications@shepi.ai>`

## Setup Instructions

### Step 1: Verify Resend Domain
1. Log in to [Resend Dashboard](https://resend.com/domains)
2. Verify `shepi.ai` domain is verified
3. Ensure DNS records are configured:
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: Resend-provided keys
   - DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@shepi.ai`

### Step 2: Set Supabase Secrets
```bash
# Get your Resend API key from https://resend.com/api-keys
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx --project-ref mdgmessqbfebrbvjtndz

# Generate a webhook secret for auth-email-hook signature verification
supabase secrets set SEND_EMAIL_HOOK_SECRET=$(openssl rand -base64 32) --project-ref mdgmessqbfebrbvjtndz
```

### Step 3: Deploy Email Functions
```bash
# Deploy all email-related functions
supabase functions deploy auth-email-hook --project-ref mdgmessqbfebrbvjtndz
supabase functions deploy notify-admin --project-ref mdgmessqbfebrbvjtndz
supabase functions deploy send-engagement-email --project-ref mdgmessqbfebrbvjtndz
```

### Step 4: Configure Supabase Auth Hook
1. Open [Supabase Auth Hooks](https://supabase.com/dashboard/project/mdgmessqbfebrbvjtndz/auth/hooks)
2. Under **Send Email Hook**, click **Enable Hook**
3. Set **Endpoint URL** to:
   ```
   https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/auth-email-hook
   ```
4. Set **HTTP Headers** (optional, for signature verification):
   ```json
   {
     "webhook-secret": "your_SEND_EMAIL_HOOK_SECRET_value"
   }
   ```
5. Click **Save**

### Step 5: Test Authentication Emails
1. Sign out of shepi.ai
2. Try to sign up with a new test email
3. Check your inbox for the confirmation email
4. Verify it's sent from `shepi-ai <noreply@shepi.ai>`
5. Click the confirmation link to verify it works

## Verification

### Check Resend Dashboard
- Go to [Resend Emails](https://resend.com/emails)
- You should see emails being sent from `notifications@shepi.ai` and `noreply@shepi.ai`
- Check delivery status and open rates

### Check Supabase Function Logs
```bash
# View auth-email-hook logs
supabase functions logs auth-email-hook --project-ref mdgmessqbfebrbvjtndz

# View notify-admin logs  
supabase functions logs notify-admin --project-ref mdgmessqbfebrbvjtndz
```

## Troubleshooting

### Emails not sending
1. Verify `RESEND_API_KEY` is set: `supabase secrets list`
2. Check function logs for errors
3. Verify Resend domain is verified
4. Check Resend account credits/limits

### Auth emails still using Supabase default
1. Verify Auth Hook is enabled in dashboard
2. Check hook URL is correct
3. Redeploy `auth-email-hook` function

### Welcome emails not sending
1. Verify `notify-admin` function is deployed
2. Check that signup triggers call this function
3. Review function logs for errors

## Migration Complete ✅

All email functionality has been migrated from Lovable Cloud to Resend:
- ✅ Auth emails (signup, password reset, etc.)
- ✅ Admin notifications
- ✅ Welcome emails
- ✅ Engagement nurture sequence
- ✅ All URLs updated to `shepi.ai`

No Lovable Cloud dependencies remain in the email system.
