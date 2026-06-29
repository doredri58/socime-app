-- System prompts table for admin AI configuration
create table if not exists public.system_prompts (
  key        text primary key,
  content    text not null,
  updated_at timestamptz default now(),
  updated_by uuid references public.users(id)
);

-- Only admins/founders can read or write (via service client — RLS is a safety net)
alter table public.system_prompts enable row level security;

-- No user-facing RLS policy; all access goes through the service-role client in admin routes.
