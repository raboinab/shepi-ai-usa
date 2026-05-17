
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'cpa-sla-daily-check',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/cpa-sla-check',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
