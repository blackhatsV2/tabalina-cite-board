# 05 — Student sees their breakdown

**What to build:** a student opens the home page on their phone, types
their ID number and access code, and sees their own breakdown — and
nothing else. This is the core of the demo.

**Blocked by:** 04

**Status:** todo

- [ ] The student lookup is created in the database from a numbered SQL
      file: it returns one student's name, section name, headings and
      scores only when the ID number and access code both match, and
      never returns the access code or any other row
- [ ] The home page is the student sign-in: ID number + access code
- [ ] A correct pair shows the breakdown: student name, section name,
      and every item in Sheet order with its score
- [ ] A wrong ID number or wrong code shows the same message: "ID number
      or access code is wrong."
- [ ] A correct ID number with a wrong code shows nothing
- [ ] A second student sees their own, different data
- [ ] Sign out returns to the sign-in page
- [ ] The starter page and the deploy-test line are gone
- [ ] Works on the live URL, on a phone
