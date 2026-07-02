-- social_tokens.extra_data: written by FB/TikTok OAuth callbacks and read by the
-- publisher (page_id, ig_account_id, open_id) — code referenced it but the column
-- never existed, so every real OAuth connection failed on upsert.
alter table social_tokens add column if not exists extra_data jsonb;

-- business_profiles: fields collected by the "תיק עסק" UI but silently dropped
-- because the columns never existed.
alter table business_profiles
  add column if not exists company_id      text,
  add column if not exists website         text,
  add column if not exists instagram       text,
  add column if not exists facebook        text,
  add column if not exists linkedin        text,
  add column if not exists tiktok          text,
  add column if not exists target_audience text,
  add column if not exists unique_value    text;
