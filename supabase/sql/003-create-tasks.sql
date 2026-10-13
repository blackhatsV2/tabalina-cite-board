-- 003-create-tasks.sql
-- Create the tasks table for CITE Boardroom with Row Level Security enabled.

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid references advisers(id) on delete set null,
  title text not null,
  description text not null default '',
  event_date text not null,
  venue text not null,
  is_confirmed boolean not null default false,
  confirmed_at timestamptz,
  oic_approval text not null default 'pending',
  dean_approval text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table tasks enable row level security;

-- Policy: anyone may read tasks
create policy "anyone can read tasks"
  on tasks for select
  to anon, authenticated
  using (true);

-- Policy: anyone may update task confirmation
create policy "anyone can update task confirmation"
  on tasks for update
  to anon, authenticated
  using (true)
  with check (true);

-- Seed sample CITE Week tasks linked to advisers by their year level
insert into tasks (adviser_id, title, description, event_date, venue, oic_approval, dean_approval)
select
  id,
  case year_level
    when 'Year 1' then 'Coordinate Freshmen Booth & Orientation'
    when 'Year 2' then 'Monitor Year 2 booth setup & Tech Expo'
    when 'Year 3' then 'Facilitate IT Hackathon Judging & Logistics'
    when 'Year 4' then 'Oversee Capstone Showcase & Stage Program'
    else 'General CITE Week Duty'
  end,
  case year_level
    when 'Year 1' then 'Assist students with table arrangement and attendance scanning.'
    when 'Year 2' then 'Check electrical outlets, monitor setup of interactive projects, and keep headcount.'
    when 'Year 3' then 'Ensure judges have scoring sheets and coordinate with student technical team.'
    when 'Year 4' then 'Assist graduating students with presentation podium, certificates, and guest reception.'
    else 'Coordinate with OIC for event logistics.'
  end,
  case year_level
    when 'Year 1' then 'Dec 15, 8:00 AM'
    when 'Year 2' then 'Dec 16, 10:00 AM'
    when 'Year 3' then 'Dec 17, 1:00 PM'
    when 'Year 4' then 'Dec 18, 9:00 AM'
    else 'Dec 15, 9:00 AM'
  end,
  case year_level
    when 'Year 1' then 'Main Atrium'
    when 'Year 2' then 'Room 205'
    when 'Year 3' then 'IT Laboratory 3'
    when 'Year 4' then 'University Auditorium'
    else 'Campus Grounds'
  end,
  case year_level
    when 'Year 1' then 'approved'
    when 'Year 2' then 'approved'
    when 'Year 3' then 'pending'
    when 'Year 4' then 'approved'
  end,
  case year_level
    when 'Year 1' then 'pending'
    when 'Year 2' then 'pending'
    when 'Year 3' then 'pending'
    when 'Year 4' then 'approved'
  end
from advisers;
