# Fix OAuth Login Redirect to localhost:8080

## Problem
After migrating to Supabase project `mdgmessqbfebrbvjtndz`, Google sign-in completes successfully but redirects to `http://localhost:3000/#access_token=...` instead of `http://localhost:8080`, causing the app to never receive the session.

## Root Cause
Supabase validates every `redirectTo` against the project's Redirect URL allowlist. When the requested URL isn't allowed, Supabase silently falls back to the project's Site URL. The new project was provisioned with:
- **Site URL**: `http://localhost:3000` (incorrect)
- **Missing**: `http://localhost:8080/**` from the allowlist

## Solution

### Step 1: Update Supabase Dashboard Configuration

1. **Open URL Configuration**
   - Navigate to: https://supabase.com/dashboard/project/mdgmessqbfebrbvjtndz/auth/url-configuration

2. **Set Site URL**
   - Change **Site URL** from `http://localhost:3000` to your production URL
   - **Set to**: `https://shepi.ai`
   - **Important**: Do NOT set this to localhost — it's the fallback for production

3. **Add Redirect URLs**
   Add the following URLs to the **Redirect URLs** list (one per line):
   
   **Development URLs:**
   ```
   http://localhost:8080/**
   http://localhost:8080/auth
   http://localhost:8080/auth/callback
   http://localhost:8080/reset-password
   ```
   
   **Production URLs:**
   ```
   https://shepi.ai/**
   https://shepi.ai/auth
   https://shepi.ai/auth/callback
   https://shepi.ai/reset-password
   ```

4. **Save Configuration**
   - Click **Save** at the bottom of the page

### Step 2: Verify Google OAuth Configuration

1. **Open Google Provider Settings**
   - Navigate to: https://supabase.com/dashboard/project/mdgmessqbfebrbvjtndz/auth/providers
   - Click on **Google**

2. **Check Authorized Redirect URIs**
   - Verify that the Google OAuth client (in Google Cloud Console) includes:
     ```
     https://mdgmessqbfebrbvjtndz.supabase.co/auth/v1/callback
     ```
   - Since users are receiving valid JWTs, this is likely already configured correctly
   - But worth verifying to ensure no future issues

### Step 3: Local Configuration (Already Done)

The local `supabase/config.toml` has been updated with:
```toml
[auth]
site_url = "http://localhost:8080"
additional_redirect_urls = ["http://localhost:8080/**"]
```

This ensures local Supabase CLI (`supabase db reset`, etc.) uses the correct URLs.

## Verification Steps

1. **Clear Browser State**
   ```bash
   # Clear localStorage and cookies for:
   # - http://localhost:8080
   # - https://mdgmessqbfebrbvjtndz.supabase.co
   ```

2. **Test Google Sign-In**
   - Start dev server: `npm run dev`
   - Navigate to: http://localhost:8080/auth
   - Click **Continue with Google**
   - **Expected**: After Google consent, redirect to `http://localhost:8080/auth#access_token=...`
   - **App should**: Automatically detect session and redirect to dashboard

3. **Verify Network Request**
   - Open browser DevTools → Network tab
   - Look for the 302 redirect from `mdgmessqbfebrbvjtndz.supabase.co/auth/v1/callback`
   - **Expected**: Should redirect to `http://localhost:8080/auth#...`
   - **Not**: `http://localhost:3000/auth#...`

4. **Test All Auth Flows**
   - **Email Signup**: Should redirect to `/auth/callback`
   - **Password Reset**: Should redirect to `/reset-password`
   - **Session Persistence**: Reload page — session should persist via localStorage

## Technical Details

### Code Verification (No Changes Needed)
- ✅ `src/pages/Auth.tsx:181-184` — Passes `redirectTo: ${window.location.origin}/auth`
- ✅ `src/integrations/supabase/client.ts` — Uses `detectSessionInUrl: true`
- ✅ `vite.config.ts:56-59` — Dev server runs on port 8080
- ✅ No hardcoded `localhost:3000` in auth paths

### Why This Happens
Supabase's redirect validation:
1. OAuth provider (Google) redirects to `mdgmessqbfebrbvjtndz.supabase.co/auth/v1/callback`
2. Supabase checks if the `redirectTo` parameter is in the allowlist
3. If **NOT** in allowlist → falls back to **Site URL**
4. If Site URL = `localhost:3000` → user lands on wrong port

## Production Deployment

When deploying to production:
1. Ensure **Site URL** in dashboard = `https://shepi.ai`
2. Ensure **Redirect URLs** include all production routes:
   - `https://shepi.ai/**`
   - `https://shepi.ai/auth`
   - `https://shepi.ai/auth/callback`
   - `https://shepi.ai/reset-password`

## Reference
- Supabase Auth Docs: https://supabase.com/docs/guides/auth/redirect-urls
- Project: `mdgmessqbfebrbvjtndz`
- Dev Server: `http://localhost:8080` (defined in `vite.config.ts`)
