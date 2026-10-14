-- 014-add-declined-at.sql
-- Add declined_at timestamp column to tasks table.
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).

alter table tasks add column if not exists declined_at timestamptz;

-- Backfill declined_at for existing declined tasks
update tasks
set declined_at = coalesce(completed_at, created_at)
where status = 'declined' and declined_at is null;
