-- Token management functions
-- Run this in Supabase → SQL Editor

-- ── decrement_tokens ──────────────────────────────────────────────────────────
-- Atomically deducts `amount` from users.token_balance.
-- Clamps at 0 so balance never goes negative.
-- Called from /api/generate, /api/generate-image, /api/ideas/generate, /api/onboarding
create or replace function public.decrement_tokens(uid uuid, amount integer)
returns void
language plpgsql security definer as $$
begin
  update public.users
  set token_balance = greatest(0, token_balance - amount)
  where id = uid;
end;
$$;

-- ── grant_tokens ──────────────────────────────────────────────────────────────
-- Adds `amount` to users.token_balance (used by PayPlus webhook on subscription).
create or replace function public.grant_tokens(uid uuid, amount integer)
returns void
language plpgsql security definer as $$
begin
  update public.users
  set token_balance = token_balance + amount
  where id = uid;
end;
$$;

-- ── reset_monthly_tokens ──────────────────────────────────────────────────────
-- Refills PAID subscribers to their tier allowance on the 1st of each month.
-- Free users are deliberately excluded: the 100-token grant is a one-time trial
-- (given at signup by handle_new_user), not a monthly allowance. Refilling it
-- would remove any reason to subscribe — the taste is meant to run out.
-- Triggered by pg_cron (see scheduler setup).
create or replace function public.reset_monthly_tokens()
returns void
language plpgsql security definer as $$
begin
  update public.users
  set token_balance = case
    when tier = 'agency' then 2000
    when tier = 'pro'    then 1000
    when tier = 'basic'  then 500
  end
  where tier in ('basic', 'pro', 'agency');
end;
$$;
