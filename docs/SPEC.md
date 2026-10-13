# Spec: CITE Board

## Problem
Faculty advisers receive their CITE Week tasks scattered between a Google Sheet and a Messenger group chat. Having to cross-check both channels creates confusion regarding task details, schedules, and locations, buries approvals from the dean, and wastes roughly 2 hours per week per adviser.

## Solution
CITE Board gives faculty advisers a single, unified mobile-friendly view where they can view their assigned CITE Week tasks, tap "Confirm" to acknowledge them, submit comments or resource requests directly on tasks, and see real-time approval statuses from both the OIC and Dean.

## The user
A non-technical faculty adviser (e.g., Prof. Rivera) assigned to coordinate a year level during CITE Week.

## User stories
1. As a faculty adviser, I want to select or view my assigned tasks with date, time, and venue, so that I immediately know my schedule and responsibilities in one place.
2. As a faculty adviser, I want to tap "Confirm" on any assigned task, so that the OIC knows I have reviewed and accepted the assignment.
3. As a faculty adviser, I want to view the OIC and Dean approval status badges on each task, so that I know whether the task is pending or finalized.
4. As a faculty adviser, I want to post a comment on a specific task (e.g., "Need extra chairs"), so that my questions or resource needs are visible in context.
5. As a faculty adviser, I want to see previous comments and updates on a task, so that I don't repeat questions already clarified.

## Screens
- **Screen 1: Task Board (`/`)**: A clean mobile-first board showing the adviser's assigned tasks (with venue, time, and OIC/Dean approval badges), a "Confirm" action button, and an expandable comment thread to read and submit task notes.

## Data
### 1. `advisers`
- Columns:
  - `id` (uuid, primary key)
  - `name` (text, e.g., "Prof. Rivera")
  - `year_level` (text, e.g., "Year 2")
  - `created_at` (timestamptz)
- Security: Anyone may read.

### 2. `tasks`
- Columns:
  - `id` (uuid, primary key)
  - `adviser_id` (uuid, references `advisers.id`)
  - `title` (text)
  - `description` (text)
  - `event_date` (text)
  - `venue` (text)
  - `is_confirmed` (boolean, default false)
  - `confirmed_at` (timestamptz, nullable)
  - `oic_approval` (text, default 'pending')
  - `dean_approval` (text, default 'pending')
  - `created_at` (timestamptz)
- Security: Anyone may read. Anyone may update `is_confirmed` and `confirmed_at`.

### 3. `comments`
- Columns:
  - `id` (uuid, primary key)
  - `task_id` (uuid, references `tasks.id`)
  - `author_name` (text)
  - `content` (text)
  - `created_at` (timestamptz)
- Security: Anyone may read. Anyone may insert.

## Login
No accounts required for the MVP. Advisers switch or select their profile via a simple dropdown selector on the board (e.g., "Prof. Rivera") so the demo can run without password roadblocks.

## Done for the demo
- [ ] App loads on the live URL (`https://tabalina-cite-board.vercel.app`) on mobile and desktop.
- [ ] Faculty adviser views their pre-populated CITE Week tasks with event time and venue.
- [ ] Tapping "Confirm" immediately updates the task status to Confirmed.
- [ ] Adding a comment ("Need extra chairs") displays it immediately under the task.
- [ ] Task displays visible OIC and Dean approval statuses.

## Out of scope
- Announcement broadcast tab
- Separate full management dashboards for OIC and Dean
- Faculty task creation or task editing
- File uploads and media attachments
- Push notifications, SMS, or external calendar sync
