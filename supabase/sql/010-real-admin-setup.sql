-- 010-real-admin-setup.sql
-- Complete migration for separating Demo vs Real System:
-- 1. Adds is_demo flag to both advisers and tasks
-- 2. Marks demo accounts (dean@gmail.com, oic@gmail.com, faculty@gmail.com) and their tasks
-- 3. Pre-registers Real Admin accounts (Dean Admin & OIC Admin)
-- 4. Adds RLS delete policies for tasks and advisers
--
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── STEP 1: Add is_demo columns ──────────────────────────────────────────────
alter table advisers add column if not exists is_demo boolean not null default false;
alter table tasks    add column if not exists is_demo boolean not null default false;

-- ── STEP 2: Demo accounts setup & marking ─────────────────────────────────────
-- Ensure demo adviser rows exist with is_demo = true
insert into advisers (name, year_level, email, role, is_demo)
values ('Dean (Demo)', 'Admin', 'dean@gmail.com', 'dean', true)
on conflict do nothing;

insert into advisers (name, year_level, email, role, is_demo)
values ('OIC (Demo)', 'Admin', 'oic@gmail.com', 'oic', true)
on conflict do nothing;

insert into advisers (name, year_level, email, role, is_demo)
values ('Faculty Member', 'Year 1', 'faculty@gmail.com', 'adviser', true)
on conflict do nothing;

-- Mark all three demo accounts explicitly as is_demo = true
update advisers
set is_demo = true,
    role = case
      when email = 'dean@gmail.com' then 'dean'
      when email = 'oic@gmail.com' then 'oic'
      else role
    end
where email in ('dean@gmail.com', 'oic@gmail.com', 'faculty@gmail.com');

-- ── STEP 3: Mark tasks associated with demo accounts as is_demo = true ────────
update tasks
set is_demo = true
where adviser_id in (
  select id from advisers where email in ('dean@gmail.com', 'oic@gmail.com', 'faculty@gmail.com') or is_demo = true
);

-- Existing tasks with no adviser or legacy seed data also belong to the demo sandbox
update tasks set is_demo = true
where is_demo is null or adviser_id is null;

-- Ensure demo faculty has at least 2 active demo tasks to view
do $$
declare
  v_faculty_id uuid;
begin
  select id into v_faculty_id from advisers where email = 'faculty@gmail.com' limit 1;
  if v_faculty_id is not null then
    if not exists (select 1 from tasks where adviser_id = v_faculty_id) then
      insert into tasks (adviser_id, title, description, event_date, venue, status, is_confirmed, oic_approval, dean_approval, is_demo)
      values
        (v_faculty_id, 'Coordinate Freshmen Booth & Orientation', 'Assist students with table arrangement, morning briefing, and attendance scanning.', 'Dec 15, 8:00 AM', 'Main Atrium', 'assigned', false, 'approved', 'pending', true),
        (v_faculty_id, 'Monitor Year 1 Tech Showcase & Exhibits', 'Inspect equipment connections, supervise student demonstrations, and submit safety checklist.', 'Dec 16, 10:00 AM', 'Room 205', 'accepted', true, 'approved', 'approved', true);
    end if;
  end if;
end $$;

-- ── STEP 4: Pre-register the REAL Admin accounts ──────────────────────────────
-- These represent the real system Dean and OIC (not part of the demo sandbox).
-- Real admin credentials:
-- Dean Admin: Account 'Dean Admin' / 'dean.admin@cite.edu' (password: password123)
-- OIC Admin:  Account 'OIC Admin' / 'oic.admin@cite.edu' (password: password123)

insert into advisers (name, year_level, email, role, is_demo)
select 'Dean Admin', 'Admin', 'dean.admin@cite.edu', 'dean', false
where not exists (select 1 from advisers where email = 'dean.admin@cite.edu');

insert into advisers (name, year_level, email, role, is_demo)
select 'OIC Admin', 'Admin', 'oic.admin@cite.edu', 'oic', false
where not exists (select 1 from advisers where email = 'oic.admin@cite.edu');

-- ── STEP 5: RLS Policies — Deletes for tasks & advisers ────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'tasks' and policyname = 'authenticated users can delete tasks'
  ) then
    execute 'create policy "authenticated users can delete tasks"
      on tasks for delete to authenticated, anon using (true)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'advisers' and policyname = 'authenticated users can delete advisers'
  ) then
    execute 'create policy "authenticated users can delete advisers"
      on advisers for delete to authenticated, anon using (true)';
  end if;
end $$;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Run this query after to confirm separation:
-- select email, name, role, is_demo from advisers order by is_demo, role;
-- select title, is_demo from tasks;
