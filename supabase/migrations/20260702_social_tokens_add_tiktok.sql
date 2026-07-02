-- social_tokens.platform previously only allowed instagram/facebook — LinkedIn was
-- never actually a valid value, so the LinkedIn OAuth callback would have crashed on
-- every real connection attempt. Swapping LinkedIn support for TikTok.
alter table social_tokens drop constraint social_tokens_platform_check;
alter table social_tokens add constraint social_tokens_platform_check
  check (platform = any (array['instagram'::text, 'facebook'::text, 'tiktok'::text]));
