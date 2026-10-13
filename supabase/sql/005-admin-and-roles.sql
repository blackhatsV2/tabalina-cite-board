-- 005-admin-and-roles.sql
-- Add email and role to advisers, and enable policies for task creation and approvals

alter table advisers add column if not exists email text;
alter table advisers add column if not exists role text not null default 'adviser';

-- Allow inserting new advisers when teachers register
create policy "anyone can insert advisers"
  on advisers for select
  to anon, authenticated
  using (true);

create policy "anyone can add advisers"
  on advisers for insert
  to anon, authenticated
  with check (true);

-- Allow inserting tasks (so OIC/Dean can assign new tasks)
create policy "anyone can insert tasks"
  on tasks for insert
  to anon, authenticated
  with check (true);

-- Update or insert the demo accounts in the advisers table
insert into advisers (name, year_level, email, role)
values
  ('Dean (College Dean)', 'Admin', 'dean@gmail.com', 'dean'),
  ('OIC (Officer-in-Charge)', 'Admin', 'oic@gmail.com', 'oic'),
  ('Jayrold Tabalina', 'Year 2', 'jtabalina.ui@phinmaed.com', 'adviser')
on conflict do nothing;

-- Link existing demo task to Jayrold Tabalina if not already assigned
insert into tasks (adviser_id, title, description, event_date, venue, oic_approval, dean_approval)
select
  id,
  'Coordinate IT Research Presentations & Attendance',
  'Facilitate the morning research paper symposium, ensure projector is calibrated, and record attendee sign-in.',
  'Dec 16, 1:00 PM',
  'Audio Visual Room 1',
  'pending',
  'pending'
from advisers
where email = 'jtabalina.ui@phinmaed.com'
limit 1;
