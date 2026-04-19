# 🎫 Stripe Integration Setup Guide

## Current Status

Your app has **3 Stripe Edge Functions** deployed but not configured:
- ✅ `create-checkout` - Creates Stripe checkout sessions
- ✅ `customer-portal` - Stripe customer portal access  
- ✅ `check-subscription` - Checks user subscription status
- ✅ `stripe-webhook` - Handles Stripe events

**Stripe CLI:** ✅ Installed (v1.33.0)

---

## 📋 What You Need

### 1. Stripe Account Setup
Go to https://dashboard.stripe.com

### 2. API Keys
From **Developers → API Keys**:
- **Secret Key** (sk_test_xxx or sk_live_xxx)
- **Publishable Key** (pk_test_xxx - for frontend, if needed)

### 3. Products & Prices
Your app uses these price IDs (hardcoded in `create-checkout`):
- **Monthly Plan:** `price_1SgwnYRM5BrUHL9QJyBYtR8I`
- **Per Project:** `price_1SgwnIRM5BrUHL9QP0rpNjgk`

**Option A:** Use existing price IDs (if you already have these products)  
**Option B:** Create new products and update the code

### 4. Webhook Endpoint
Your webhook URL will be:
```
https://klccgigaedojxdpnkjcd.supabase.co/functions/v1/stripe-webhook
```

---

## 🚀 Step-by-Step Setup

### Step 1: Get Your Stripe Secret Key

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Keep it safe - we'll add it in Step 4

### Step 2: Create Products (If Needed)

If you don't have the hardcoded price IDs, create products:

**A) Monthly Subscription Plan:**
1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Product name: "Shepi AI Monthly"
4. Pricing model: Recurring
5. Price: Your amount (e.g., $99/month)
6. After creation, copy the **Price ID** (starts with `price_`)

**B) Per-Project Plan:**
1. Add another product
2. Product name: "Shepi AI Project"
3. Pricing model: One-time
4. Price: Your amount (e.g., $199)
5. Copy the **Price ID**

**Update your code** if using new price IDs:
- File: `supabase/functions/create-checkout/index.ts`
- Lines 11-12: Replace with your new price IDs

### Step 3: Set Up Webhook Endpoint

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Endpoint URL: 
   ```
   https://klccgigaedojxdpnkjcd.supabase.co/functions/v1/stripe-webhook
   ```
4. Description: "Shepi AI Production Webhook"
5. Events to listen for - Select these:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Click "Add endpoint"
7. After creation, click on the endpoint
8. Find **Signing secret** - it starts with `whsec_`
9. Click "Reveal" and copy it

### Step 4: Configure Supabase Secrets

Set your Stripe keys in Supabase:

```bash
# Set Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY="sk_test_your_key_here" --project-ref klccgigaedojxdpnkjcd

# Set Webhook Secret
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_your_secret_here" --project-ref klccgigaedojxdpnkjcd
```

Or use the interactive script:
```bash
./setup-supabase-secrets.sh
# (Select only Stripe options)
```

### Step 5: Verify Secrets Are Set

```bash
supabase secrets list --project-ref klccgigaedojxdpnkjcd
```

You should see:
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_WEBHOOK_SECRET

### Step 6: Test Your Setup

Run the test suite:
```bash
./test-edge-functions.sh
```

**Expected results after configuration:**
- ✅ `create-checkout` - Should return 401 (auth required) instead of 500
- ✅ `check-subscription` - Should work properly
- ✅ `customer-portal` - Should work properly
- ✅ `stripe-webhook` - Should return 400 (missing signature) instead of 500

---

## 🧪 Testing Locally with Stripe CLI

### Forward Webhooks to Local Development

If you're running locally (`npm run dev`):

```bash
# Login to Stripe
stripe login

# Forward webhooks to your local Edge Function
stripe listen --forward-to https://klccgigaedojxdpnkjcd.supabase.co/functions/v1/stripe-webhook
```

This will show you webhook events in real-time as they happen.

### Test Creating a Checkout Session

```bash
# You'll need a valid JWT token from your app
# Get it from browser DevTools → Application → Local Storage → supabase.auth.token

curl -X POST https://klccgigaedojxdpnkjcd.supabase.co/functions/v1/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "monthly"
  }'
```

### Test a Webhook Event

```bash
stripe trigger checkout.session.completed
```

---

## 📊 What Each Function Does

### create-checkout
**Purpose:** Creates Stripe checkout session for payments  
**Requires Auth:** Yes  
**Parameters:**
- `planType`: "monthly" or "per_project"
- `projectId`: Required for per_project

**Returns:** Checkout URL to redirect user to

### check-subscription
**Purpose:** Checks if user has active subscription  
**Requires Auth:** Yes  
**Returns:** Subscription status

### customer-portal
**Purpose:** Generates Stripe customer portal URL  
**Requires Auth:** Yes  
**Returns:** Portal URL for managing subscription

### stripe-webhook
**Purpose:** Receives and processes Stripe events  
**Requires Auth:** No (verified by signature)  
**Events Handled:**
- Checkout completion
- Subscription creation/update/deletion
- Invoice paid/failed

---

## 🔒 Security Notes

### Never Commit These:
- ❌ Stripe Secret Key
- ❌ Webhook Secret
- ❌ Any `sk_` or `whsec_` values

### Safe to Commit:
- ✅ Price IDs (they're public)
- ✅ Publishable Key (pk_test_ or pk_live_)

### Test vs Production:
- **Test Mode:** Use `sk_test_` and `pk_test_` keys
- **Production:** Use `sk_live_` and `pk_live_` keys
- Keep them separate!

---

## 🚨 Troubleshooting

### Issue: "STRIPE_SECRET_KEY is not set"
**Solution:** Run Step 4 above to set the secret

### Issue: "Webhook signature verification failed"
**Solution:** 
1. Verify webhook secret is correct
2. Make sure endpoint URL in Stripe Dashboard matches exactly
3. Check that you're sending to the right environment (test vs live)

### Issue: Price IDs don't exist
**Solution:**
1. Create products in Stripe Dashboard (Step 2)
2. Update `supabase/functions/create-checkout/index.ts` lines 11-12
3. Redeploy: `supabase functions deploy create-checkout`

### Issue: Webhook events not being received
**Solution:**
1. Check endpoint URL in Stripe Dashboard
2. Verify webhook secret is set correctly
3. Check Supabase function logs:
   ```bash
   supabase functions logs stripe-webhook --project-ref klccgigaedojxdpnkjcd
   ```

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Stripe Secret Key is set in Supabase
- [ ] Webhook Secret is set in Supabase
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook listens to all 6 required events
- [ ] Products and prices created (or using existing ones)
- [ ] Price IDs in code match your Stripe products
- [ ] Test checkout flow works
- [ ] Test webhook receives events
- [ ] Subscription status updates in database

---

## 📞 Need Help?

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Test your setup:** `./test-edge-functions.sh`

---

## 🎉 Ready to Go!

Once configured, your app will be able to:
- ✅ Accept monthly subscriptions
- ✅ Accept one-time project payments
- ✅ Automatically update subscription status
- ✅ Handle failed payments
- ✅ Provide customer portal for users

Happy billing! 💰
