-- 011-enable-realtime.sql
-- Enables Supabase Realtime on tasks, comments, and advisers tables.
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).

-- Enable realtime publication for tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table advisers;
