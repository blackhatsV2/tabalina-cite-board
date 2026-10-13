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
