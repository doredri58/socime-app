-- Agency tier + multi-business support
-- 1) Allow the 'agency' tier — the PayPlus webhook sets tier='agency' on an
--    Agency subscription; the old check constraint (free/basic/pro) rejected it.
alter table public.users drop constraint if exists users_tier_check;
alter table public.users add constraint users_tier_check
  check (tier = any (array['free'::text, 'basic'::text, 'pro'::text, 'agency'::text]));

-- 2) Active-business pointer — which of the user's businesses is currently
--    selected (context switching). business_profiles already allows many rows
--    per user (no unique constraint on user_id), so no change needed there.
alter table public.users
  add column if not exists active_business_id uuid
  references public.business_profiles(id) on delete set null;
