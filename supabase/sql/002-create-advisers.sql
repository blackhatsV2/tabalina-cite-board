-- 002-create-advisers.sql
-- Create the advisers table for CITE Board with Row Level Security enabled.

create table if not exists advisers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year_level text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table advisers enable row level security;

-- Policy: anyone may read advisers (public read for student & faculty board)
create policy "anyone can read advisers"
  on advisers for select
  to anon, authenticated
  using (true);

-- Seed initial faculty advisers
insert into advisers (name, year_level)
values
  ('Prof. Rivera', 'Year 2'),
  ('Prof. Santos', 'Year 1'),
  ('Prof. Cruz', 'Year 3'),
  ('Prof. Dalisay', 'Year 4');
