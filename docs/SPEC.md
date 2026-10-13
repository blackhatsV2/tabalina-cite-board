# Spec: Student Breakdown Viewer (working title)

## Problem
I'm Justine, a teacher with four sections and about 220 students. My
students can't see their own breakdown, so every week I call them up one
by one to look at it on my laptop, and they forget and ask again. I
can't share my Google Sheet because everyone would see everyone's
scores, and Google Classroom only shows final grades.

## Solution
Once a week, Justine downloads each section's Google Sheet as a CSV and
uploads it. Each student gets a private access code once. After that,
any student can open the website on their phone, type their ID number
and access code, and see their own full breakdown — every item uploaded
so far — and nobody else's.

## The user
Justine, the teacher. Students are the audience: they never create an
account, and they can only view their own breakdown.

## User stories
1. As Justine, I want to sign in with my email and password, so that
   only I can manage my sections.
2. As Justine, I want to add a section by name, so that each class's
   scores are kept separate.
3. As Justine, I want to upload a section's CSV each week, so that
   students see the latest scores without me re-typing anything.
4. As Justine, I want every student in an upload to get an access code
   automatically, and keep the same code on later uploads, so that I
   only hand codes out once.
5. As Justine, I want to print the access codes for a section, so that
   I can hand each student their own slip.
6. As Justine, I want to give a student a new access code, so that a
   lost code doesn't lock them out.
7. As a student, I want to type my ID number and access code, so that I
   can see my own breakdown any time, from my phone.
8. As a student, I want to see every item in the order it appears in
   the Sheet, so that my breakdown matches what Justine records.

## Screens
1. **Student sign-in (home page):** the student types their ID number
   and access code. A wrong ID number or a wrong code shows the same
   message: "ID number or access code is wrong."
2. **My breakdown:** the student's name, the section name, and every
   breakdown item in Sheet order with its score. A Sign out button. Only
   their own row.
3. **Teacher sign-in:** Justine signs in with email and password. Has
   its own address; not linked from the student pages.
4. **My sections:** Justine's sections, each with its student count and
   last upload date. Justine can add a new section by name.
5. **Section page:** upload this week's CSV (replaces the previous
   upload). Below it, a table of students with ID number, name and
   access code, a New code button per student, and a Print codes
   button.

## Data

### `sections` — one row per class section
- `id`
- `teacher_id` — the account of the teacher who owns the section
- `name` — e.g. "BSIT 2-A"
- `columns` — the breakdown item headings from the latest CSV, in order
- `uploaded_at` — when the latest CSV was uploaded

**Who may do what:** only the owning teacher may read, add, change or
delete their own sections. Students and strangers: no access.

### `students` — one row per student per section
- `id`
- `section_id` — which section this row belongs to
- `id_number` — the student's school ID number (unique within a section)
- `name`
- `access_code` — random code, easy to read aloud (no look-alike
  characters such as 0/O or 1/I)
- `scores` — this student's values from the latest CSV, matched to the
  section's headings
- `updated_at`

**Who may do what:** only the teacher who owns the section may read,
add, change or delete these rows. Students and strangers: no direct
access at all — not even to their own row.

### Student lookup
A function inside the database that anyone may call with an ID number
and an access code. If both match one student row exactly, it returns
that student's name, section name, headings and scores — never the
access code and never any other row. Otherwise it returns nothing.

### Uploading rules
- The CSV must have columns named `ID Number` and `Name`. Every other
  column is a breakdown item, kept in the CSV's order.
- Values in a CSV may contain commas (e.g. "Dela Cruz, Juan"), so the
  upload must handle quoted values correctly.
- An upload replaces the section's headings and every student's scores.
  Because the Sheet keeps every item from the semester, the latest
  upload always holds the student's full record.
- Students already in the section keep their access code. New ID
  numbers get a new code. Students missing from the new CSV are removed.
- If the CSV has no `ID Number` or `Name` column, nothing is changed
  and Justine sees a clear message saying which column is missing.

## Login
- **Justine:** Supabase Auth, email and password. The account is
  created once in the Supabase dashboard. Public sign-up is switched
  off, so nobody else can make an account.
- **Students:** no accounts. ID number + access code are checked by the
  student lookup every time. An ID number alone never shows anything.

## Done for the demo
On the LIVE URL:
- [ ] Justine can sign in; a wrong password is refused.
- [ ] Justine can add a section and upload a sample CSV with made-up
      scores.
- [ ] The section page lists every student with an access code, and the
      codes print cleanly.
- [ ] A student signs in with ID number + access code on a phone and
      sees their full breakdown.
- [ ] A second student sees different data; neither sees the other's.
- [ ] A correct ID number with a wrong code shows nothing.
- [ ] Uploading an updated CSV changes the scores but keeps the codes.
- [ ] New code works, and the old code stops working.
- [ ] RLS is on for both tables, and `/code-review` has no red items.
- [ ] Justine and 5 classmates have tried it.

## Out of scope
- Admin role and account management
- ITSD-issued ID creation
- Typing or editing scores in the app
- Reading Google Sheets directly
- Other teachers
- Notifications
- Calculating final grades
- Saving each week's upload as a separate version
- Locking out repeated wrong access codes
- Students resetting their own access code
- Emailing or texting access codes
- Choosing the project name
