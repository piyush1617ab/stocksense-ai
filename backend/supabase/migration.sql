-- ================================================================
--  StockSense AI — Supabase Migration
--  Run this in: Supabase Dashboard → SQL Editor
--
--  Creates the chat_history table used by the AI chatbot
--  to remember conversations across sessions.
-- ================================================================

create table if not exists chat_history (
  id         uuid        default gen_random_uuid() primary key,
  user_id    text        not null,
  role       text        not null check (role in ('user', 'assistant')),
  content    text        not null,
  created_at timestamptz default now()
);

-- Fast lookups per user sorted by time
create index if not exists idx_chat_history_user_time
  on chat_history (user_id, created_at desc);

-- Optional: auto-delete messages older than 30 days (keeps DB clean)
-- Uncomment if you want this:
-- create extension if not exists pg_cron;
-- select cron.schedule(
--   'delete-old-chat-history',
--   '0 3 * * *',
--   $$ delete from chat_history where created_at < now() - interval '30 days' $$
-- );

-- Row Level Security (optional but recommended for production)
-- alter table chat_history enable row level security;
-- create policy "Users can only see their own messages"
--   on chat_history for all
--   using (user_id = auth.uid()::text);
