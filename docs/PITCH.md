# Pitch — Student Breakdown Viewer (working title)

Written to be spoken in first person by Justine. If someone else
presents a beat, change "I" and "my" to "Justine" and "her/his/their"
as fits, and mark the speaker.

## The script

**1. The person — Justine (~45s)**

Every week, in each of my four sections, I do the same thing. I call a
student's name. They walk to the front of the room. They lean over my
laptop and look at their scores. Then I call the next name. And the
next. Some sections have fifty-five students. A week later, the same
student comes back and asks me again, because they forgot.

**2. Today — Justine (~30s)**

I keep everything in Google Sheets. Attendance, activities, quizzes,
exams. I can't share that sheet, because then every student sees
everyone else's scores. Google Classroom only shows the final grade, not
the breakdown. So my laptop is the only place a student can see their
own record. That's about two hundred and twenty students, every week,
one at a time. By our estimate, that's around three and a half hours a
week.

**3. Our fix — Justine (~45s)**

So we're building a simple website that lets every student see their
own breakdown, privately, any time. Once a week, I download my sheet
and upload it. The first time, each student gets a private access code
from me. After that, they sign in with their ID number and that code,
on their own phone, whenever they want. They see their attendance,
their quizzes, their exams. Only theirs. Nobody lines up at my desk.

**4. The demo moment — Justine (~30s)**

In Session 3 we'll show it live. I'll upload a sample sheet with
made-up scores. One student signs in on a phone and sees their
breakdown. Then a second student signs in and sees completely different
numbers. Neither of them can see the other's.

**5. How we'll know — Justine (~30s)**

Before Session 3, five classmates will try it as students, and I'll try
it as the teacher. We'll come back and tell you what happened. Did each
person see only their own record? How long did signing in take? What
confused them? And what broke, because something will.

## Three hard questions

**1. "This is one teacher's problem — yours. How do you know anyone
else wants this?"**

This is the weakest point in our problem. Today our evidence is one
teacher, and we haven't asked students yet. Honest answer: "Right now
we know it's real for me and my 220 students. Before Session 1 we asked
[N] students and [N] other teachers, and here's what they said."
Fill in those numbers only after you've actually asked. See
*Strengthen before presenting* below.

**2. "You're replacing one queue with another. Handing out 220 access
codes is work too, and students will lose them."**

Honest answer: "Yes, handing out codes is work. But it's once a
semester, not every week. If a student loses their code, I can make a
new one for them. We'd rather do that than let anyone sign in with
just an ID number, because classmates know each other's ID numbers."

**3. "These are real grades. How do you keep them safe on a public
website?"**

Honest answer: "Until our app passes a code review, we only test it
with made-up scores. The database itself has rules that only let a
signed-in student read their own row. Even if someone pokes at the
website directly, they can't see other students. Students can't change
anything, and only I can upload."

## Strengthen before presenting

The problem is real but the evidence is thin in two places:

- **The 3½ hours a week is a guess.** Next time you show students their
  scores, time one full section with your phone's stopwatch and use
  the real number.
- **No students or other teachers have been asked.** Ask 5 students:
  "Would you check your scores yourself if you could?" Ask 2 other
  teachers: "Do you show students their breakdown? How?" Even two
  sentences of what they said makes beat 1 much harder to argue with.
