-- Scheduler: retry & error tracking
-- Run in Supabase → SQL Editor

ALTER TABLE scheduler
  ADD COLUMN IF NOT EXISTS error_message  TEXT,
  ADD COLUMN IF NOT EXISTS attempt_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at  TIMESTAMPTZ;

-- Update status constraint to include 'pending_approval' + 'processing'
ALTER TABLE scheduler DROP CONSTRAINT IF EXISTS scheduler_status_check;
ALTER TABLE scheduler
  ADD CONSTRAINT scheduler_status_check
  CHECK (status IN (
    'draft','pending_approval','queued','processing',
    'published','failed','paused'
  ));

-- Index for cron: picks up queued posts efficiently
DROP INDEX IF EXISTS idx_scheduler_queued_at;
CREATE INDEX IF NOT EXISTS idx_scheduler_cron
  ON scheduler (status, scheduled_at)
  WHERE status = 'queued';

-- Monthly token reset via pg_cron (enable pg_cron extension first in Supabase Dashboard)
-- SELECT cron.schedule('reset-monthly-tokens', '0 0 1 * *', $$SELECT reset_monthly_tokens()$$);
