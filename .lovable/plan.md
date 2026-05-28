## Goal
Give Amber Hamilton (amber@redwoodrise.com) 1 project credit so she can create a project without a subscription.

## Target user
- user_id: `50a89ae8-3890-496b-a929-62e2d59f9d64`
- No existing `user_credits` row.

## Change
Insert one row into `public.user_credits`:

```sql
INSERT INTO public.user_credits (user_id, credits_remaining, total_credits_purchased)
VALUES ('50a89ae8-3890-496b-a929-62e2d59f9d64', 1, 1);
```

## Verification
Re-query `user_credits` for Amber and confirm `credits_remaining = 1`. `useSubscription` / `canCreateProjects` will then allow her to create a project (projectCredits > 0 short-circuits the gate).

## Notes
- No schema/RLS changes — pure data insert via the insert tool.
- If you'd prefer a different amount (e.g. 3 credits), say so and I'll adjust before running.
