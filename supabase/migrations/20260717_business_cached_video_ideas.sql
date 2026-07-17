-- Phase 2 of the idea bank: cache the AI-generated video scripts per business,
-- mirroring cached_post_ideas. A batch of 6 personalised video scripts costs the
-- same 20 tokens as the post batch and persists until regenerated or all sent.
alter table public.business_profiles
  add column if not exists cached_video_ideas jsonb,
  add column if not exists video_ideas_generated_at timestamptz;
