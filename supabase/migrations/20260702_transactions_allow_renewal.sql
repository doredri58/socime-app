-- Allow 'renewal' transaction type for the automatic subscription renewal cron.
alter table transactions drop constraint transactions_transaction_type_check;
alter table transactions add constraint transactions_transaction_type_check
  check (transaction_type = any (array['subscription'::text, 'renewal'::text, 'topup'::text, 'refund'::text]));
