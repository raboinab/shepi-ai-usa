-- Hourly cron: auto-accept CPA claims after 48h
SELECT cron.unschedule('cpa-auto-accept-hourly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cpa-auto-accept-hourly');
SELECT cron.schedule(
  'cpa-auto-accept-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/cpa-auto-accept',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);