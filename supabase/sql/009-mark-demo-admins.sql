-- 009-mark-demo-admins.sql
-- Mark dean@gmail.com and oic@gmail.com as demo accounts so their data
-- is completely sandboxed from the real board.
-- Real admin accounts will be created separately with different emails.
--
-- Run once in Supabase SQL Editor after 008-real-admin-accounts-and-demo-separation.sql.

update advisers
set is_demo = true
where email in ('dean@gmail.com', 'oic@gmail.com', 'faculty@gmail.com');

-- Also add a delete policy on tasks so real admins can remove them
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'tasks' and policyname = 'authenticated users can delete tasks'
  ) then
    create policy "authenticated users can delete tasks"
      on tasks for delete
      to authenticated
      using (true);
  end if;
end $$;

-- Add a delete policy on advisers so real admins can remove accounts
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'advisers' and policyname = 'authenticated users can delete advisers'
  ) then
    create policy "authenticated users can delete advisers"
      on advisers for delete
      to authenticated
      using (true);
  end if;
end $$;

-- Verify:
-- select email, name, role, is_demo from advisers order by is_demo, role;
