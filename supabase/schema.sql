-- SociMe PostgreSQL Schema
-- Run this in Supabase → SQL Editor

-- ── users ─────────────────────────────────────────────
create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  name         text,
  plan         text not null default 'free' check (plan in ('free','pro')),
  token_balance integer not null default 0,
  created_at   timestamptz not null default now(),
  last_login_at timestamptz
);

-- auto-update last_login_at on each sign-in via trigger
create or replace function public.handle_last_login()
returns trigger language plpgsql security definer as $$
begin
  update public.users set last_login_at = now() where id = new.id;
  return new;
end;
$$;

-- ── transactions ──────────────────────────────────────
create table if not exists public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  transaction_type   text not null check (transaction_type in ('subscription','topup','refund')),
  amount_paid_ils    numeric(10,2) not null default 0,
  stripe_payment_id  text,
  tokens_granted     integer not null default 0,
  created_at         timestamptz not null default now()
);

-- ── token_ledger ──────────────────────────────────────
create table if not exists public.token_ledger (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  tokens_used  integer not null,
  api_cost_usd numeric(10,6) not null default 0,
  action_type  text not null check (action_type in ('generate_post','video_ideas','moderation','other')),
  post_id      uuid,
  created_at   timestamptz not null default now()
);

-- ── scheduler ─────────────────────────────────────────
create table if not exists public.scheduler (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  content_text  text not null,
  hashtags      text,
  platform      text[] not null default '{}',
  status        text not null default 'draft' check (status in ('draft','scheduled','published','failed')),
  scheduled_at  timestamptz,
  published_at  timestamptz,
  meta_post_id  text,
  error_message text,
  created_at    timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────
alter table public.users enable row level security;
alter table public.transactions enable row level security;
alter table public.token_ledger enable row level security;
alter table public.scheduler enable row level security;

-- users: see & edit only own row
create policy "users_own" on public.users for all using (auth.uid() = id);

-- transactions: see only own
create policy "transactions_own" on public.transactions for all using (auth.uid() = user_id);

-- token_ledger: see only own
create policy "ledger_own" on public.token_ledger for all using (auth.uid() = user_id);

-- scheduler: see only own
create policy "scheduler_own" on public.scheduler for all using (auth.uid() = user_id);
