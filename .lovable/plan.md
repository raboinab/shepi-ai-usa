
# Fix: only notify on engagement chat, not AI assistant chat

## What's wrong
The previous fix skipped `role='assistant'` rows, but a CPA prompting the AI inserts a `role='user'` row in `chat_messages` with `context_type='wizard'`. The trigger still fires and emails get sent.

Verified in logs: after the fix was deployed, 3 more `cpa_notifications` rows + nudge_log entries were created (03:10–03:13 UTC May 29) — all from `context_type='wizard'` AI chat by the CPA.

The real client↔CPA channel is `context_type='engagement'` (see `src/components/EngagementChat.tsx`). That's the only context where notifications should fire.

## Change

**Migration** — update `notify_cpa_chat_message` trigger function:

Replace the current early-return:
```sql
IF NEW.role = 'assistant' THEN RETURN NEW; END IF;
```
with:
```sql
IF NEW.context_type IS DISTINCT FROM 'engagement' THEN RETURN NEW; END IF;
```

This covers both directions in one check: AI assistant turns (`wizard`/other contexts) and the CPA's own AI prompts (also `wizard`) are both skipped. Only `engagement` rows — the real human↔human channel — proceed to email + in-app notification.

**Edge function defense-in-depth** — `supabase/functions/cpa-notify/index.ts`, `handleChatMessage`:
After loading the message row, early-return if `message.context_type !== 'engagement'` (replace the current `role === 'assistant'` check). Same intent, correct dimension.

No schema, policy, grant, or frontend changes. `EngagementChat` continues to insert with `context_type: 'engagement'`, so real chat still notifies.

## Verification
- Insert a `chat_messages` row with `context_type='wizard'` on the CPA-claimed project → no `nudge_log`, no `cpa_notifications`, no Resend send.
- Insert a row with `context_type='engagement'` (or send a message via `EngagementChat`) → notification + email fire as today.
- Inspect `cpa_notifications` after a fresh AI chat turn — count should not increase.

## Out of scope
Per-recipient debounce, moving to managed email queue, whether engagement chat should email at all — unchanged.
