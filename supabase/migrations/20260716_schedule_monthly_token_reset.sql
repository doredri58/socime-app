-- Wire up the monthly token reset that was defined but never scheduled.
-- Without this, paid subscribers never get their monthly allowance refilled.
--
-- reset_monthly_tokens() (see tokens_rpc.sql) refills basic/pro/agency and
-- skips free + admin/founder accounts.

create extension if not exists pg_cron;

-- Idempotent: drop any prior schedule before (re)creating it.
select cron.unschedule('reset-monthly-tokens')
where exists (select 1 from cron.job where jobname = 'reset-monthly-tokens');

-- 00:00 on the 1st of every month.
select cron.schedule('reset-monthly-tokens', '0 0 1 * *', $$select public.reset_monthly_tokens();$$);
