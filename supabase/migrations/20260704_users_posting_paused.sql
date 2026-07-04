-- Global "pause everything" switch: while true, the publishing cron skips all
-- of this user's scheduled posts until the user turns it back off.
alter table users add column if not exists posting_paused boolean not null default false;
