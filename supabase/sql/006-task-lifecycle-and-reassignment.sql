-- 006-task-lifecycle-and-reassignment.sql
-- Add status, decline_reason, year_level, remarks columns to tasks
-- Enable task deletion and adviser year_level reassignment with RLS policies

alter table tasks add column if not exists status text not null default 'assigned';
alter table tasks add column if not exists decline_reason text;
alter table tasks add column if not exists year_level text;
alter table tasks add column if not exists remarks text;

-- Backfill statuses for existing tasks
update tasks
set status = 'completed'
where is_confirmed = true
  and oic_approval = 'approved'
  and dean_approval = 'approved'
  and (status is null or status = 'assigned');

update tasks
set status = 'accepted'
where is_confirmed = true
  and (status is null or status = 'assigned');

-- Allow anyone to delete tasks
create policy "anyone can delete tasks"
  on tasks for delete
  to anon, authenticated
  using (true);

-- Allow anyone to update advisers (for reassigning faculty year level)
create policy "anyone can update advisers"
  on advisers for update
  to anon, authenticated
  using (true)
  with check (true);
