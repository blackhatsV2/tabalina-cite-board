# 08 — Admin and Faculty Dashboards

**What to build:**
1. **Dean and OIC Dashboard (Admin View)**:
   - Top shortcut button: "Assign a Task" (expandable form with dropdown for faculty names, dropdown for year levels, task title, description, location, time, date).
   - Left section: **Pending Tasks** (tasks not approved by admin or OIC and faculty, or approved by faculty but not yet approved by admin or OIC). Shown as titles only: `(Faculty name, Year level, Task title)`. When clicked, expands to show status (declined with reason, or pending), Delete task, and Edit task (to update task details and pass it back to the faculty).
   - Right section: **Faculty Directory List** (showing Name, assigned Year level, and task count, 0 when none). When clicked, expands to show: Reassign year level, list of tasks assigned to that faculty (also expandable showing current status), and "Add another task" button.
2. **Faculty Dashboard (Adviser View)**:
   - Left section: **New Assigned Tasks** list. Expands when clicked to show details and actions: "Decline task" (required reason), "Accept task" (optional comment/notes).
   - Right section: **Accepted Tasks** list (tasks accepted and admin-approved, but not yet finished). Shown as list (title, year level, date) and expands to show: "Resolve" button (moves task to Finished Tasks section) and remarks.
   - Bottom section: **Finished Tasks** and **Tasks from Other Faculties** as expandable lists.

**Blocked by:** 07

**Status:** done

- [x] Admin Top shortcut: "Assign a Task" button and form with faculty dropdown, year level, title, description, location, time, date
- [x] Admin Left section: Pending tasks list with (Faculty name, year level, task title), expandable with status/reason, edit & reassign, delete, and approve
- [x] Admin Right section: Faculties list showing name, year level, task count; expandable with year level reassignment, assigned tasks list, and Add another task button
- [x] Faculty Left section: New Assigned tasks expandable with Decline (reason required) and Accept (optional notes)
- [x] Faculty Right section: Accepted tasks (title, year level, date) expandable with Resolve button and remarks
- [x] Faculty Bottom section: Finished tasks and Tasks from other faculties expandable lists
- [x] Works on the live URL
