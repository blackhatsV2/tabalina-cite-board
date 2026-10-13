-- 013-create-messages.sql
-- Create messages table for Global Chat with Row Level Security enabled.
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  sender_email text,
  sender_role text default 'Faculty',
  content text not null,
  is_demo boolean default false,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table messages enable row level security;

-- Policy: anyone can read messages
create policy "anyone can read messages"
  on messages for select
  to anon, authenticated
  using (true);

-- Policy: anyone can insert messages
create policy "anyone can insert messages"
  on messages for insert
  to anon, authenticated
  with check (true);

-- Enable Realtime publication for messages table
alter publication supabase_realtime add table messages;

-- Seed initial welcome messages
insert into messages (sender_name, sender_email, sender_role, content, is_demo) values
  ('College Dean', 'dean@gmail.com', 'Dean', 'Welcome to the CITE Boardroom Global Chat! Feel free to ask questions or post event coordination updates here.', true),
  ('OIC Coordinator', 'oic@gmail.com', 'OIC', 'Please make sure to review and acknowledge your assigned CITE Week duties.', true);
