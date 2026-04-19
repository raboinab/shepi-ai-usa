# 🚀 Shepi AI - Complete Setup Guide

## ✅ What's Already Done

Your Shepi AI application has been successfully migrated to your own Supabase instance!

### Completed Steps
- ✅ **Database Setup** - All 11 tables created with RLS policies
- ✅ **App Configuration** - Connected to your Supabase (klccgigaedojxdpnkjcd)
- ✅ **Edge Functions** - All 13 functions deployed
- ✅ **TypeScript Types** - Auto-generated from database schema
- ✅ **Test Suite** - Comprehensive testing tools created
- ✅ **Security** - .env excluded from git, .env.example provided

---

## 🎯 Current Status

### Working Right Now (No Config Needed)
These features work immediately:
- ✅ User authentication (sign up/login)
- ✅ Project creation and management
- ✅ Document uploads
- ✅ Dashboard and data queries
- ✅ Contact form submissions

### Waiting for API Keys (Optional)
These features need external service keys:
- ⚠️ **Stripe payments** (3 functions) - Needs Stripe API keys
- ⚠️ **AI insights** (2 functions) - Needs Lovable/OpenAI API key
- ⚠️ **Webhooks** (3 functions) - Needs webhook secrets
- ⚠️ **Email** - Needs Resend API key
- ⚠️ **Document processing** - Needs DocuClipper keys

---

## 📋 Next Steps

### Option 1: Start Developing Now (Recommended)
Test the working features first:

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**Test these features:**
1. Create an account
2. Create a project
3. Upload a document
4. Navigate the dashboard

### Option 2: Configure External Services
Add API keys for payment, AI, and webhook features:

```bash
# Run the interactive setup script
./setup-supabase-secrets.sh
```

This will prompt you for each API key and configure them safely.

---

## 🔑 API Keys Reference

### Required for Payments (Stripe)
- **STRIPE_SECRET_KEY** - From [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
- **STRIPE_WEBHOOK_SECRET** - From Stripe Dashboard → Webhooks

### Optional Services

**Email (Resend)**
- **RESEND_API_KEY** - From [Resend Dashboard](https://resend.com/api-keys)

**AI Features (Lovable)**
- **LOVABLE_API_KEY** - From your Lovable dashboard

**Document Processing (DocuClipper)**
- **DOCUCLIPPER_API_KEY** - From DocuClipper account
- **DOCUCLIPPER_API_URL** - Usually `https://api.docuclipper.com`
- **DOCUCLIPPER_WEBHOOK_SECRET** - Generate random string

**Backend Services**
- **SHEPI_POSTGRES_API_KEY** - Your PostgreSQL service
- **SHEPI_POSTGRES_API_URL** - Your PostgreSQL service URL
- **SHEPI_SHEETS_API_KEY** - Your Sheets service
- **SHEPI_SHEETS_API_URL** - Your Sheets service URL
- **ORCHESTRATOR_API_KEY** - Your orchestrator service
- **ORCHESTRATOR_WEBHOOK_SECRET** - Generate random string
- **DOCUMENT_PARSER_API_URL** - Your parser service URL

---

## 🛠️ Useful Commands

### Database Management
```bash
# View current migrations
supabase migration list

# Create new migration
supabase db diff --file new_migration

# Push migrations to remote
supabase db push

# Regenerate TypeScript types
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name

# View function logs
supabase functions logs function-name

# Test all functions
./test-edge-functions.sh
```

### Secrets Management
```bash
# List all secrets
supabase secrets list

# Set a secret
supabase secrets set SECRET_NAME=value

# Unset a secret
supabase secrets unset SECRET_NAME
```

---

## 📊 Your Supabase Project

**Project Reference:** `klccgigaedojxdpnkjcd`  
**Project URL:** https://klccgigaedojxdpnkjcd.supabase.co  
**Dashboard:** https://supabase.com/dashboard/project/klccgigaedojxdpnkjcd

### Database Tables
1. **profiles** - User profile information
2. **user_roles** - Role-based access control
3. **projects** - Main project data
4. **documents** - File uploads and metadata
5. **subscriptions** - Stripe subscription management
6. **workflows** - Background job tracking
7. **company_info** - QuickBooks connection data
8. **docuclipper_jobs** - Document processing jobs
9. **adjustment_proofs** - Adjustment validation
10. **project_payments** - Payment records
11. **contact_submissions** - Contact form data

### Edge Functions (13 total)
**Working immediately (5):**
- submit-contact
- create-project-sheet (with auth)
- sync-sheet (with auth)
- extract-document-text (with auth)
- process-statement (with auth)

**Need configuration (8):**
- check-subscription (Stripe)
- create-checkout (Stripe)
- customer-portal (Stripe)
- validate-adjustment-proof (Lovable AI)
- insights-chat (Lovable AI)
- orchestrator-webhook (webhook secret)
- docuclipper-webhook (DocuClipper)
- stripe-webhook (Stripe)

---

## 🧪 Testing

### Test Edge Functions
```bash
./test-edge-functions.sh
```

This tests all 13 Edge Functions and shows which are working and which need configuration.

### View Detailed Test Report
```bash
cat EDGE_FUNCTIONS_TEST_REPORT.md
```

---

## 🔒 Security Best Practices

### Environment Variables
- ✅ `.env` is excluded from git
- ✅ `.env.example` provided for team members
- ✅ Each developer creates their own `.env` from the example

### Secrets Management
- ✅ Never commit API keys to git
- ✅ Use `supabase secrets set` for Edge Function secrets
- ✅ Use `.env` for frontend environment variables
- ✅ Rotate secrets regularly

### Database Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Service role bypasses RLS for Edge Functions
- ✅ Admin roles for elevated permissions

---

## 📚 Documentation

### Files Created
- **`setup-supabase-secrets.sh`** - Interactive secrets setup
- **`test-edge-functions.sh`** - Edge Functions test suite
- **`EDGE_FUNCTIONS_TEST_REPORT.md`** - Detailed test results
- **`supabase/migrations/20251227000000_initial_schema.sql`** - Database schema
- **`SETUP_GUIDE.md`** - This file

### Important Files
- **`.env`** - Your environment variables (not in git)
- **`.env.example`** - Template for team members
- **`src/integrations/supabase/client.ts`** - Supabase client config
- **`src/integrations/supabase/types.ts`** - Auto-generated types

---

## 🚨 Troubleshooting

### Issue: Edge Function returns 500 error
**Solution:** Check if required secrets are set
```bash
supabase secrets list
./test-edge-functions.sh
```

### Issue: Database query fails
**Solution:** Regenerate types from current schema
```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Issue: Authentication not working
**Solution:** Verify .env has correct Supabase URL and keys
```bash
cat .env
# Should show your klccgigaedojxdpnkjcd project
```

### Issue: Can't deploy Edge Functions
**Solution:** Make sure you're linked to the correct project
```bash
supabase link --project-ref klccgigaedojxdpnkjcd
```

---

## 💡 Tips

1. **Start Simple**: Test core features (auth, projects) before adding integrations
2. **Add Secrets Gradually**: Configure services as you need them
3. **Test Often**: Run `./test-edge-functions.sh` after setting new secrets
4. **Keep Types Updated**: Regenerate after database schema changes
5. **Monitor Logs**: Use Supabase Dashboard to monitor function logs

---

## 🎉 You're All Set!

Your Shepi AI application is:
- ✅ Running on your own infrastructure
- ✅ Database fully configured
- ✅ Edge Functions deployed
- ✅ Ready for development

**Start developing:**
```bash
npm run dev
```

**Need help?** Check the [Supabase Documentation](https://supabase.com/docs) or your test reports.

Happy coding! 🚀
