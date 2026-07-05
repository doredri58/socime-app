-- Landing-page demo leads: captured when a visitor asks for the full generated
-- post by email (zero-friction lead gen). No auth — public funnel.
create table if not exists leads (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  pain_point     text,
  generated_post text,
  source         text not null default 'bait_demo',
  emailed        boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists leads_email_idx      on leads (email);
create index if not exists leads_created_at_idx  on leads (created_at desc);

-- RLS on, no public policies: only the service-role key (server) can read/write.
alter table leads enable row level security;
