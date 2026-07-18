-- business_profiles.account_type: distinguishes a real business ('business')
-- from a private creator / aspiring influencer ('creator'). Added so onboarding
-- can stop forcing business framing on creators, and so we can MEASURE how large
-- the creator segment actually is before deciding whether to expand the ICP.
-- Default 'business' keeps every existing row valid.
alter table business_profiles
  add column if not exists account_type text not null default 'business';
