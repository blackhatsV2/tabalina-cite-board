# Spec: CITE Boardroom

## Problem
Faculty advisers receive their CITE Week tasks scattered between a Google Sheet and a Messenger group chat. Having to cross-check both channels creates confusion regarding task details, schedules, and locations, buries approvals from the dean, and wastes roughly 2 hours per week per adviser.

## Solution
CITE Boardroom gives faculty advisers a single, unified mobile-friendly view where they can view their assigned CITE Week tasks, tap "Confirm" to acknowledge them, submit comments or resource requests directly on tasks, and see real-time approval statuses from both the OIC and Dean.

## The user
A non-technical faculty adviser (e.g., Prof. Rivera) assigned to coordinate a year level during CITE Week.

## User stories
1. As a faculty adviser, I want to see my own name and assigned tasks with date, time, and venue, so that I immediately know my schedule and responsibilities.
2. As a faculty adviser, I want a tab for "My Tasks" and a tab for "Other Faculties' Tasks", so that I can focus on my work while keeping visibility on team coordination.
3. As a faculty adviser, I want to tap "Confirm" on my assigned tasks, so that the OIC knows I have reviewed and accepted the assignment.
4. As a faculty adviser, I want to view OIC and Dean approval statuses and post comments/resource requests directly on tasks.
5. As an admin (OIC or Dean), I want to see all faculty members, view their assigned tasks, and create/assign new tasks to them.

## Screens
- **Screen 1: Faculty Dashboard (`/`)**: 
  - Left Section: **New Assigned Tasks** list (expandable). Actions: "Decline task" (requires decline reason), "Accept task" (optional comment/notes).
  - Right Section: **Accepted Tasks** list (title, year level, date, expandable). Shows tasks accepted & admin-approved but not yet finished. Action: "Resolve" button (moves task to Finished Tasks section) and remarks.
  - Bottom Section: **Finished Tasks** and **Tasks from Other Faculties** lists (expandable).
- **Screen 2: Dean and OIC Dashboard (Admins)**:
  - Top Action: "Assign a Task" button/form shortcut (dropdown for faculty names, dropdown for year levels, task title, description, location, time, date).
  - Left Section: **Pending Tasks** list (titles only: Faculty name, year level, task title). Click to expand shows status (declined with reason, or pending), Delete action, and Edit action (to update task details and pass back to faculty). Also allow admin approval.
  - Right Section: **Faculties List** (shows Name, assigned year level, task count, 0 if none). Click to expand faculty to: reassign year level, view expandable list of tasks assigned to that faculty with status, and "Add another task" button.

## Data
### 1. `advisers`
- Columns:
  - `id` (uuid, primary key)
  - `name` (text, e.g., "Prof. Rivera")
  - `year_level` (text, e.g., "Year 2")
  - `email` (text, optional)
  - `role` (text, default 'adviser', or 'oic'/'dean')
  - `created_at` (timestamptz)
- Security: Anyone may read, insert, and update.

### 2. `tasks`
- Columns:
  - `id` (uuid, primary key)
  - `adviser_id` (uuid, references `advisers.id`)
  - `title` (text)
  - `description` (text)
  - `event_date` (text)
  - `venue` (text)
  - `year_level` (text, nullable)
  - `status` (text, default 'assigned' — 'assigned', 'accepted', 'declined', 'completed')
  - `decline_reason` (text, nullable)
  - `is_confirmed` (boolean, default false)
  - `confirmed_at` (timestamptz, nullable)
  - `oic_approval` (text, default 'pending')
  - `dean_approval` (text, default 'pending')
  - `created_at` (timestamptz)
- Security: Anyone may read, insert, update, and delete.

### 3. `comments`
- Columns:
  - `id` (uuid, primary key)
  - `task_id` (uuid, references `tasks.id`)
  - `author_name` (text)
  - `content` (text)
  - `created_at` (timestamptz)
- Security: Anyone may read. Anyone may insert.

## Login
Supabase Auth with 1-click demo logins for Faculty Adviser, OIC Coordinator, and College Dean. Faculty members see their own name; OIC and Dean access admin features.

## Done for the demo
- [x] App loads on the live URL (`https://tabalina-cite-board.vercel.app`) on mobile and desktop.
- [x] Faculty adviser views their pre-populated CITE Week tasks with event time and venue.
- [x] Tapping "Confirm" immediately updates the task status to Confirmed.
- [x] Adding a comment displays it immediately under the task.
- [x] Task displays visible OIC and Dean approval statuses.
- [x] Faculty members only see their own name, with tabs for "My Tasks" and "Other Faculties' Tasks".
- [x] Admins (OIC and Dean) can see all faculties and create new tasks for them.
- [ ] Dean & OIC Dashboard: Left section with pending tasks (expandable: decline status + reason, pending status, edit & reassign, delete); Right section with faculty list (expandable: reassign year level, task list with statuses, add task); Top shortcut "Assign a Task".
- [ ] Faculty Dashboard: Left section "New Assigned Tasks" (expandable: decline with required reason, accept with optional comments); Right section "Accepted Tasks" (expandable: resolve button, remarks); Bottom section "Finished Tasks" and "Tasks from Other Faculties".

## Out of scope
- Announcement broadcast SMS/push notifications
- File uploads and media attachments
- External calendar synchronization
