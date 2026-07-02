-- token_ledger.action_type only allowed 4 legacy values while the code logs 10 —
-- every deduction log except generate_post failed silently, so usage history and
-- Gemini cost tracking were empty.
alter table token_ledger drop constraint token_ledger_action_type_check;
alter table token_ledger add constraint token_ledger_action_type_check
  check (action_type = any (array[
    'generate_post', 'generate_image', 'generate_ideas', 'onboarding',
    'video_transcribe', 'video_render',
    'agent_competitor', 'agent_ad_copy', 'agent_adapt',
    'admin_impersonate',
    'video_ideas', 'moderation', 'other'
  ]::text[]));
