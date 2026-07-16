-- Personalised idea bank: cache the AI-generated post ideas per business so the
-- bank loads instantly and only regenerates on demand (the "רענן" button),
-- rather than calling Gemini on every visit.
alter table public.business_profiles
  add column if not exists cached_post_ideas jsonb,
  add column if not exists post_ideas_generated_at timestamptz;
