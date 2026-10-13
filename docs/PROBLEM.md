<<<<<<< HEAD
# CITE Board

## Who
A non-technical faculty adviser (e.g., Prof. Rivera) assigned to advise a specific year level during CITE Week at the College of Information Technology Education.

## The struggle
Faculty advisers receive their CITE Week tasks via a Google Sheet and a group chat (Messenger). They must check both places to see their tasks, understand details, comment, or suggest changes. Information is often duplicated, outdated, or split between the two apps, leading to confusion about what they are supposed to do, when, where, and with whom. The dean must manually scan the group chat for approvals, which are easily buried in conversations.

## Today's workaround
The OIC (Officer-in-Charge) posts tasks in a Google Sheet and announces them in the faculty group chat. Faculty advisers toggle between the sheet and chat to see their assigned tasks, add comments, or request changes. The dean reviews the chat for approval signals. This process costs each adviser approximately 2 hours per week in extra coordination time, leads to missed updates (e.g., venue changes seen only hours before the event), and causes duplicate effort as multiple advisers ask the same clarifying questions in the chat.

## The MVP
CITE Board lets a faculty adviser see their assigned tasks for CITE Week, confirm understanding, add comments, and view approval status from the OIC and dean in a single, simple interface.

## How we'll know it worked
Demo: A faculty adviser logs in, sees a list of their tasks (e.g., "Monitor Year 2 booth setup – Dec 16, 10 AM, Room 205"), taps "Confirm" on one task, adds a comment ("Need extra chairs"), and sees the OIC and dean approval status update in real time. Three non-technical faculty advisers will test it during the next CITE Week planning meeting.

## Out of scope
- Announcement tab (broadcast messages to all users)
- Separate dashboards for OIC and dean (beyond task visibility and approval tracking)
- Task creation/edit by faculty (only OIC assigns tasks)
- File attachments or multimedia
- Calendar sync or notifications beyond in-app status

## Glossary
- **Confirm**: Faculty adviser taps to indicate they have understood and accepted the task as assigned.
- **Comment**: Faculty adviser can add a note or suggestion on a task (visible to OIC and dean).
- **OIC**: Officer-in-Charge of CITE Week, responsible for creating and assigning tasks.
- **Dean**: College Dean who reviews and approves tasks before finalization.
=======
# Student Breakdown Viewer (working title)

## Who
Justine, a teacher with 4 sections of up to 55 students each (about 220
students), who records every student's attendance, activities, quizzes
and exams in Google Sheets.

## The struggle
Students have no way to see their own breakdown. Justine calls each
student's name, the student comes to the front, and looks at their
breakdown on Justine's screen. Then the next student is called. Scores
change every week, so this repeats every week. Students forget what
they saw and come back to ask again.

## Today's workaround
- **Google Sheets:** holds all the records, but sharing it would show
  every student everyone else's scores.
- **Google Classroom (school tool):** shows students their final grade
  only, not the breakdown of attendance, activities, quizzes and exams.
- **Calling students one by one:** the only private way to show a
  breakdown today.

Cost: delay and repeated work every week. Our estimate (not yet
measured) is about 1 minute per student, roughly 3½ hours a week across
220 students.

## The MVP
Justine uploads a section's CSV exported from Google Sheets, and each
student signs in with their ID number and a one-time access code to see
only their own breakdown.

## How we'll know it worked
- **Test:** Justine uploads a sample CSV with made-up scores and real
  test ID numbers. Justine tests the teacher side; 5 classmates test the
  student side. Each student sees only their own row and cannot see
  anyone else's.
- **Demo:** upload the CSV → a student signs in with ID number and
  access code → sees their breakdown → a second student signs in and
  sees different data.
- **Who tries it before Session 3:** Justine and 5 classmates.

### Must never
- Show a student another student's scores, names or rankings.
- Let a student sign in with an ID number alone. A secret access code
  is always required, because classmates know each other's ID numbers.
- Let students change anything. Students view only; only Justine
  uploads.
- Use real student data before the app passes `/code-review`.

## Out of scope
- Admin role and account management (creating, editing, deleting
  accounts)
- ITSD-issued ID creation
- Typing scores directly into the app
- Reading Google Sheets directly (we upload a CSV instead)
- Other teachers
- Notifications
- Calculating final grades
- Choosing the project name (decide later)

## Glossary
- **Breakdown**: one student's itemised scores (activities, quizzes,
  exams, check-ins) and attendance for one class.
- **Distribute**: each student can see their own breakdown, any time,
  without asking the teacher.
- **Teacher**: Justine, the only person who can upload data.
- **Student**: someone whose ID number appears in an uploaded CSV. Can
  only view their own breakdown.
- **ID number**: the student's school ID number, already in the Sheet.
  Says *which* row is theirs, but is not secret.
- **Access code**: a random one-time code the app creates for each
  student ID. Justine hands it out once. ID number + access code proves
  the student is who they say they are.
- **CSV**: a plain spreadsheet file, downloaded from Google Sheets with
  File → Download → CSV.
>>>>>>> eee0881e03698660d1d2704d09d3ca3b6e354fdb
