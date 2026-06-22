-- ══════════════════════════════════════════
-- SociMe — Queue: תוספת סטטוס processing + meta_post_id
-- הרץ ב: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════

-- הוספת עמודות לטבלת scheduler
ALTER TABLE scheduler
  ADD COLUMN IF NOT EXISTS meta_post_id TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- עדכון constraint הסטטוס לכלול 'processing'
ALTER TABLE scheduler DROP CONSTRAINT IF EXISTS scheduler_status_check;
ALTER TABLE scheduler
  ADD CONSTRAINT scheduler_status_check
  CHECK (status IN ('pending','approved','queued','processing','published','failed','paused'));

-- אינדקס לביצועי Cron
CREATE INDEX IF NOT EXISTS idx_scheduler_queued_at
  ON scheduler (status, scheduled_at)
  WHERE status = 'queued';
