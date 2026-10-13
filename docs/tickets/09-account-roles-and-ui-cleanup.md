# Ticket 09 — Account Cleanup, Dynamic Admin Privileges & Professional UI

**User story:**
As the CITE Dean and OIC, I want only official built-in accounts (Dean, OIC, and a Faculty dummy account) rather than scattered demo accounts. I also want admins to be able to grant or revoke admin privileges for any faculty member directly in the dashboard, and view a clean, professional interface free of decorative emojis.

**Acceptance criteria:**
1. Only three built-in quick login accounts are shown in the Auth bar:
   - Dean (Admin): `dean@gmail.com`
   - OIC (Admin): `oic@gmail.com`
   - Faculty Member (Dummy): `faculty@gmail.com`
2. SQL migration `007-cleanup-accounts-and-permissions.sql` removes legacy demo accounts, reassigns tasks to the built-in faculty dummy account, and ensures RLS policies allow role updates.
3. Admins can view each faculty member's role in the Faculty Directory and click "Grant Admin Privileges" or "Revoke Admin Privileges" to promote or demote any faculty member dynamically.
4. User role resolution checks the database `advisers` table on login and dynamic changes, granting full admin powers (assigning tasks, approving pending tasks, managing accounts) to promoted users.
5. All emojis across the application UI are removed and replaced with clean, professional text labels and badges.
