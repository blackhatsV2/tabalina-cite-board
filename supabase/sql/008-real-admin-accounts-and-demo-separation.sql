-- 008-real-admin-accounts-and-demo-separation.sql
-- 1. Rename built-in admin accounts to proper display names.
-- 2. Add is_demo flag to tasks and advisers so demo data is clearly separate
--    from real operational data on the board.
-- 3. Mark faculty@gmail.com and all its tasks as demo.
--
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

-- ─── Admin display names ──────────────────────────────────────────────────────

update advisers
set name        = 'Dean Admin',
    year_level  = 'Admin',
    role        = 'dean'
where email = 'dean@gmail.com';

update advisers
set name        = 'OIC Admin',
    year_level  = 'Admin',
    role        = 'oic'
where email = 'oic@gmail.com';

-- In case the rows don't exist yet (fresh DB):
insert into advisers (name, year_level, email, role)
values ('Dean Admin', 'Admin', 'dean@gmail.com', 'dean')
on conflict (id) do nothing;

insert into advisers (name, year_level, email, role)
values ('OIC Admin', 'Admin', 'oic@gmail.com', 'oic')
on conflict (id) do nothing;

-- ─── Demo flag columns ────────────────────────────────────────────────────────

-- Add is_demo to advisers (safe to run even if column already exists)
alter table advisers
  add column if not exists is_demo boolean not null default false;

-- Add is_demo to tasks
alter table tasks
  add column if not exists is_demo boolean not null default false;

-- ─── Mark the demo faculty account and its tasks ──────────────────────────────

update advisers
set is_demo = true
where email = 'faculty@gmail.com';

-- Mark any tasks assigned to the demo faculty account as demo
update tasks
set is_demo = true
where adviser_id in (
  select id from advisers where email = 'faculty@gmail.com'
);

-- ─── RLS — make sure policies allow reading / updating the new column ─────────
-- (existing policies already cover the rows; no new policy needed for a column)

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- After running, check:
--   select email, name, role, is_demo from advisers;
--   select title, is_demo from tasks;
