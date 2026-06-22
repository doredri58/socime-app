-- ══════════════════════════════════════════
-- SociMe — Phase 1 Schema Migration
-- הרץ ב: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════

-- 1. עדכון טבלת users קיימת
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pin_hash         TEXT,
  ADD COLUMN IF NOT EXISTS tier             TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','basic','pro')),
  ADD COLUMN IF NOT EXISTS image_count_this_month INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_reset_date  DATE,
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted'));

-- 2. תיקי עסק (Onboarding)
CREATE TABLE IF NOT EXISTS business_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name       TEXT NOT NULL,
  raw_description     TEXT,
  parsed_system_prompt TEXT,
  tone_of_voice       TEXT CHECK (tone_of_voice IN ('funny','serious','professional','warm')),
  phone               TEXT,
  address             TEXT,
  operating_hours     TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 3. אחסון OAuth tokens מוצפנים
CREATE TABLE IF NOT EXISTS social_tokens (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform                TEXT NOT NULL CHECK (platform IN ('instagram','facebook')),
  encrypted_oauth_token   TEXT NOT NULL,
  scopes                  TEXT[],
  expires_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- 4. רעיונות שמורים (בנק רעיונות)
CREATE TABLE IF NOT EXISTS saved_ideas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_text   TEXT NOT NULL,
  category    TEXT CHECK (category IN ('value','marketing','vibe')),
  liked       BOOLEAN DEFAULT FALSE,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. לוג שימוש בתמונות (מכסה חודשית)
CREATE TABLE IF NOT EXISTS image_usage_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 6. תקופות חסימה (Blackout Periods)
CREATE TABLE IF NOT EXISTS blackout_periods (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime   TIMESTAMPTZ NOT NULL,
  label          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 7. עדכון scheduler — הוספת עמודות חסרות
ALTER TABLE scheduler
  ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('text','image','video')) DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS source       TEXT CHECK (source IN ('generated','uploaded')) DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS payload_url  TEXT,
  ADD COLUMN IF NOT EXISTS caption      TEXT;

-- עדכון status enum של scheduler
ALTER TABLE scheduler
  DROP CONSTRAINT IF EXISTS scheduler_status_check;
ALTER TABLE scheduler
  ADD CONSTRAINT scheduler_status_check
  CHECK (status IN ('pending','approved','queued','published','failed','paused'));

-- ══ RLS Policies ══════════════════════════

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens     ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_ideas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_usage_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_periods  ENABLE ROW LEVEL SECURITY;

-- business_profiles
CREATE POLICY "users see own profile" ON business_profiles
  FOR ALL USING (auth.uid() = user_id);

-- social_tokens
CREATE POLICY "users see own tokens" ON social_tokens
  FOR ALL USING (auth.uid() = user_id);

-- saved_ideas
CREATE POLICY "users see own ideas" ON saved_ideas
  FOR ALL USING (auth.uid() = user_id);

-- image_usage_log
CREATE POLICY "users see own image log" ON image_usage_log
  FOR ALL USING (auth.uid() = user_id);

-- blackout_periods
CREATE POLICY "users see own blackouts" ON blackout_periods
  FOR ALL USING (auth.uid() = user_id);

-- ══ Function: איפוס מכסת תמונות חודשית ══
CREATE OR REPLACE FUNCTION reset_monthly_image_counts()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users
  SET image_count_this_month = 0,
      next_reset_date = (date_trunc('month', now()) + interval '1 month')::date
  WHERE next_reset_date <= now()::date OR next_reset_date IS NULL;
END;
$$;
