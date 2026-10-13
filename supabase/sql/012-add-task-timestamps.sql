-- 012-add-task-timestamps.sql
-- Add accepted_at and completed_at timestamp columns to tasks table.
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).

alter table tasks add column if not exists accepted_at timestamptz;
alter table tasks add column if not exists completed_at timestamptz;

-- Backfill accepted_at from existing confirmed_at column
update tasks
set accepted_at = confirmed_at
where accepted_at is null and confirmed_at is not null;

-- Backfill completed_at for existing finished tasks
update tasks
set completed_at = coalesce(confirmed_at, created_at)
where status = 'completed' and completed_at is null;
