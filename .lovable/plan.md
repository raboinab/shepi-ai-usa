# Suppress notifications for AI assistant chat turns

## Problem
Every message in `chat_messages` on a CPA-claimed project fires the `notify_cpa_chat_message` trigger → `cpa-notify` edge function, which sends both an email (via Resend) and an in-app `cpa_notifications` row. This fires for AI assistant turns too, so a CPA using the AI assistant generates emails to the client (for the CPA's prompt) and to the CPA (for the AI's reply). Neither is a real human message.

## Fix
Skip both email and in-app notification when the chat message is an AI turn — i.e. `role = 'assistant'`. Real human↔human chat (client ↔ CPA) is unaffected.

Apply the filter at the **trigger** level so the edge function isn't even invoked for assistant rows (cheaper, and removes the bypass risk entirely).

## Changes

1. **Migration** — update the `notify_cpa_chat_message` trigger function in `supabase/migrations/`:
   - Add `IF NEW.role = 'assistant' THEN RETURN NEW; END IF;` near the top of the function body, before it builds the payload / calls `net.http_post` to `cpa-notify`.
   - No schema changes, no policy changes, no grants needed.

2. **Defense in depth** — in `supabase/functions/cpa-notify/index.ts`, `handleChatMessage`:
   - After loading the message row, early-return (200, `skipped: 'assistant_message'`) if `message.role === 'assistant'`. This protects against any other future caller of the function and makes the intent obvious in logs.
   - No changes to debounce logic, recipient routing, Resend call, or `nudge_log`.

3. **No frontend changes.** `NotificationBell` and `useChatHistory` are unaffected.

## Out of scope (not changing now)
- Per-project vs per-recipient debounce window
- Moving `cpa-notify` onto the managed email queue / adding unsubscribe footer
- `From:` domain (apex vs `notify.` subdomain)
- Whether real human chat should email at all

Happy to do any of those in a follow-up if you want.

## Verification
- Locate trigger function definition: `rg -n "notify_cpa_chat_message" supabase/migrations`
- After migration: insert an `assistant` row in `chat_messages` on a CPA-claimed project → no row in `nudge_log`, no row in `cpa_notifications`, no Resend log entry in `cpa-notify` function logs.
- Insert a `user` row (real client message) → notification + email still fire as today.
