-- Widen tone_of_voice to match the 7 tones offered in the Business Portfolio UI
-- (was funny/serious/professional/warm — saving 'direct'/'inspiring'/'casual' failed).
alter table public.business_profiles drop constraint if exists business_profiles_tone_of_voice_check;
alter table public.business_profiles add constraint business_profiles_tone_of_voice_check
  check (tone_of_voice = any (array[
    'professional'::text, 'warm'::text, 'funny'::text, 'serious'::text,
    'direct'::text, 'inspiring'::text, 'casual'::text
  ]));
