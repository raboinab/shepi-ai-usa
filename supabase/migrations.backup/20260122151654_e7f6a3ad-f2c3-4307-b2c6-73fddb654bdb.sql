-- Unschedule the proactive token refresh cron job
SELECT cron.unschedule('refresh-qb-tokens-job');