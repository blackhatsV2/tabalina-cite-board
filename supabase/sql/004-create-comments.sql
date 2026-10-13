-- 004-create-comments.sql
-- Create comments table with Row Level Security for task discussions and clarifications

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table comments enable row level security;

-- Policy: anyone may read comments
create policy "anyone can read comments"
  on comments for select
  to anon, authenticated
  using (true);

-- Policy: anyone may insert comments
create policy "anyone can add comments"
  on comments for insert
  to anon, authenticated
  with check (true);

-- Seed initial coordination comment on tasks
insert into comments (task_id, author_name, content)
select
  id,
  'OIC Team',
  'Please coordinate with student marshals 15 minutes before the scheduled time.'
from tasks;
