# CATME example files

All of the files in this folder contain **entirely fictitious** data for a made-up
course, CMPSC 123, Fall 2026. The four files describe the same 24 students in two
sections and six teams of four.

| File | Format | Purpose |
|------|--------|---------|
| `CMPSC123-Fall-2026-Fake-Egrades.csv` | UCSB eGrades roster | Upload this first, as the course roster. |
| `CMPSC123-Fall-2026-Fake-Teams.csv` | Frontiers team upload (`team,email`) | Puts the 24 students on teams `cmpsc123-01` through `cmpsc123-06`. |
| `FakeInstructor-TeamFormation-CMPSC-123-Fall-2026-matches.csv` | CATME TeamFormation export | Agrees exactly with the two files above: same students, IDs, emails, sections and teams. |
| `FakeInstructor-TeamFormation-CMPSC-123-Fall-2026-mismatches.csv` | CATME TeamFormation export | Deliberately disagrees with the two files above (see below). |

## About the CATME format

The CATME files copy the layout of a real CATME TeamFormation export. That layout is
not a conventional CSV file, even though it has a `.csv` extension. It has several
sections, each with its own header row, separated by blank lines:

1. Lines 1–2: activity information (`Activity,Class,Term,Format,Instr,School`).
2. Line 3: blank.
3. Line 4 onward: survey responses, one row per student
   (`"Name","Student ID","Email","Section",...` with a trailing comma).
4. Two blank lines, then an empty `"Name","Student ID","Email","Section",` table.
5. `"Rater Practice"`: one row per student, giving the student's **team** in the
   second column. In this layout, this is the only place where team assignments appear.
6. A blank line, then `"Comments"`: one row per student. A comment may span several
   lines inside a quoted field.

Lines end with CRLF, as in the real export.

The `Section` column in the CATME files holds the eGrades **Enrl Cd** (`71530` or
`71548`), which is what Frontiers stores as a roster student's section. So the files
agree without the Translate Sections course option.

## Differences in the mismatches file

Compared with the eGrades roster and the teams CSV, the mismatches file has:

* **3 students in CATME who are not in eGrades:**
  `PEMBERWICK, GWENDOLYN`, `SALTONSTALL, CORNELIUS`, `YARBOROUGHE, MARISOL`
* **3 students in both files but on the wrong team in CATME:**
  * `QUILLFEATHER, AMARA JUNE` is on `cmpsc123-02` in CATME but `cmpsc123-01` in the teams CSV.
  * `MARLOWE-PIKE, CASPIAN LOCKE` is on `cmpsc123-03` in CATME but `cmpsc123-02` in the teams CSV.
  * `HOLLISTRAND, SORREL` is on `cmpsc123-01` in CATME but `cmpsc123-03` in the teams CSV.
* **3 students in eGrades who are not in CATME:**
  `FENNIMORE, ROSALIND IVY`, `MOONSHADOW, PERPETUA`, `WREXHAMPTON, EZEKIEL`

Names, student IDs, emails and sections match for every student who appears in both files.

## Testing the CATME roster audit

1. Sign in as an instructor and create a disposable course. On its Students tab,
   upload `CMPSC123-Fall-2026-Fake-Egrades.csv` using the UCSB eGrades format.
   Confirm that the course has 24 enrolled students.
2. On the course's Settings tab, enable CATME and leave Translate Sections disabled.
   Open the CATME tab. The roster download and the **Audit CATME Teammaker CSV
   Download** card should both be visible.
3. Click **Audit CSV** without selecting a file. Expect an instruction to choose
   a file, with no results displayed.
4. Upload `FakeInstructor-TeamFormation-CMPSC-123-Fall-2026-matches.csv` in the
   audit card and click **Audit CSV**. Expect a green result with zero additions,
   updates, and removals.
5. Select `FakeInstructor-TeamFormation-CMPSC-123-Fall-2026-mismatches.csv`.
   The previous result should clear. Audit it and expect three students to add,
   zero fields to update, and three students to remove, with the names listed
   above. This audit compares roster membership, names, and sections; it does
   not compare team assignments.
6. Make a copy of the matching export. In its first student row, change
   `"OKONKWO-LARK, NIA"` to `"OLD-NAME, NIA"` and section `"71530"` to `"99999"`.
   Audit the copy. Expect zero additions, two fields to update, and zero
   removals. The updates table should identify the current CATME values and
   the correct Frontiers values (`OKONKWO-LARK, NIA` and `71530`).
7. Select the eGrades CSV in the audit card and submit it. Expect an unrecognized
   CATME format error, no stale result, and an enabled button so another file
   can be tried. Upload the matching CATME export again and confirm it succeeds.
8. Return to the Students and Teams tabs. Auditing must not have changed the
   roster or created any teams.

The audit accepts both the survey export provided here and exports with a
`Team Name` column immediately after `Section`. Creating teams from the
`Rater Practice` section of these sample files is a separate team-import task.
