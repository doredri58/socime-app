-- Subscription lifecycle + saved PayPlus card token for automatic renewal.
alter table users
  add column if not exists subscription_plan       text,          -- 'basic' | 'pro' | 'agency'
  add column if not exists subscription_cycle      text,          -- 'monthly' | 'annual'
  add column if not exists subscription_expires_at timestamptz,   -- end of the paid period
  add column if not exists renewal_failures        integer not null default 0,
  add column if not exists payplus_token_uid       text,          -- encrypted saved-card token
  add column if not exists card_brand              text,          -- e.g. 'Visa' (display only)
  add column if not exists card_last4              text;          -- e.g. '4242' (display only)
