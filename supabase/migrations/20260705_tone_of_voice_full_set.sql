-- The onboarding tone picker offers educational/marketing/friendly and the
-- business portfolio offers warm/serious/inspiring/casual — but the constraint
-- rejected educational/marketing/friendly, so those onboarding choices (and the
-- 'friendly' default) crashed the very first save. Allow the full union.
alter table business_profiles drop constraint business_profiles_tone_of_voice_check;
alter table business_profiles add constraint business_profiles_tone_of_voice_check
  check (tone_of_voice = any (array[
    'professional','warm','funny','serious','direct','inspiring','casual',
    'educational','marketing','friendly'
  ]::text[]));
