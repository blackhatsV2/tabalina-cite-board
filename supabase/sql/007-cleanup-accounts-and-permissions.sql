-- 007-cleanup-accounts-and-permissions.sql
-- 1. Ensure RLS policies on advisers allow updating roles by authenticated or anon sessions.
-- 2. Consolidate to built-in accounts:
--    - Dean (Admin): dean@gmail.com
--    - OIC (Admin): oic@gmail.com
--    - Faculty Dummy: faculty@gmail.com
-- 3. Reassign existing tasks to the built-in faculty dummy account and remove legacy demo accounts.

-- Ensure advisers has necessary columns
alter table advisers add column if not exists email text;
alter table advisers add column if not exists role text not null default 'adviser';

-- Enable update policy if not already present
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'advisers' and policyname = 'anyone can update advisers'
  ) then
    create policy "anyone can update advisers"
      on advisers for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;

-- Upsert the two built-in Admins
insert into advisers (name, year_level, email, role)
values
  ('Dean (College Dean)', 'Admin', 'dean@gmail.com', 'dean'),
  ('OIC (Officer-in-Charge)', 'Admin', 'oic@gmail.com', 'oic')
on conflict (id) do nothing;

-- Update existing Dean and OIC rows if matched by email
update advisers set name = 'Dean (College Dean)', year_level = 'Admin', role = 'dean' where email = 'dean@gmail.com';
update advisers set name = 'OIC (Officer-in-Charge)', year_level = 'Admin', role = 'oic' where email = 'oic@gmail.com';

-- Ensure faculty dummy account exists
do $$
declare
  v_faculty_id uuid;
begin
  select id into v_faculty_id from advisers where email = 'faculty@gmail.com' limit 1;

  if v_faculty_id is null then
    insert into advisers (name, year_level, email, role)
    values ('Faculty Member', 'Year 1', 'faculty@gmail.com', 'adviser')
    returning id into v_faculty_id;
  else
    update advisers set name = 'Faculty Member', role = coalesce(role, 'adviser') where id = v_faculty_id;
  end if;

  -- Reassign all tasks from older demo advisers (or tasks with null adviser_id) to the faculty dummy
  update tasks
  set adviser_id = v_faculty_id
  where adviser_id is null
     or adviser_id in (
       select id from advisers where email not in ('dean@gmail.com', 'oic@gmail.com', 'faculty@gmail.com')
     );

  -- Clean up legacy demo adviser records that are not in the primary built-in list
  delete from advisers
  where email not in ('dean@gmail.com', 'oic@gmail.com', 'faculty@gmail.com')
     or email is null;

  -- Insert clean sample tasks for the faculty dummy if none exist
  if not exists (select 1 from tasks where adviser_id = v_faculty_id) then
    insert into tasks (adviser_id, title, description, event_date, venue, status, is_confirmed, oic_approval, dean_approval)
    values
      (v_faculty_id, 'Coordinate Freshmen Booth & Orientation', 'Assist students with table arrangement, morning briefing, and attendance scanning.', 'Dec 15, 8:00 AM', 'Main Atrium', 'assigned', false, 'approved', 'pending'),
      (v_faculty_id, 'Monitor Year 1 Tech Showcase & Exhibits', 'Inspect equipment connections, supervise student demonstrations, and submit safety checklist.', 'Dec 16, 10:00 AM', 'Room 205', 'accepted', true, 'approved', 'approved');
  end if;
end $$;
