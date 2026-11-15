# Staff CSV import results

Upload `firstName,lastName,email` CSV files from the course's Staff tab. The upload
keeps valid additions and reports rejected rows with their CSV row number, email,
and reason. Row numbers count CSV records, with the header as row 1; a quoted
field containing a newline is still part of one record.

The result includes `count` (staff successfully added) and `errors` (objects with
`row`, `email`, and `message`). A parsed file returns HTTP 200 even if every row
was rejected; callers must inspect both fields. The Staff tab shows both counts
and a table of errors, including when zero staff were added.

Names and emails are stripped of surrounding whitespace. Email comparisons are
case-sensitive and scoped to the course, matching the database rule from issue
#39. Existing records, account links, GitHub details, and membership statuses
are preserved. Each occurrence of a repeated valid email after the first is
reported as a duplicate within the file. A row rejected for invalid fields does
not prevent a later corrected row for that email from being imported.

All three fields are required and limited to the database's 255-character column
length. Email addresses must have a local part, an `@`, and a domain containing a
dot, without whitespace or additional `@` characters. Existing support for extra
columns and case-insensitive, whitespace-padded headers is retained.

An empty file, header-only file, invalid headers, or malformed CSV returns HTTP
400 with a readable `message`. The complete file is parsed before any writes.
Each accepted row and its user-account attachment run in a separate transaction.
A uniqueness conflict rolls back that row; other valid rows remain committed.
Unrelated database errors are not reported as duplicates.

## Test Plan

1. On the review deployment, sign in as an admin or the course instructor and
   verify Developer Info matches the PR head.
2. Create a disposable course and add a staff member with email
   `existing@example.com`. Record their name and status.
3. From its Staff tab, upload
   [staff_import_mixed.csv](examples/staff_import_mixed.csv).
4. Expect **Staff added: 2. Rows not imported: 3.** CSV row 3 is already on the
   course's staff, row 4 repeats an email in the file, and row 5 lacks an email.
   Confirm `new@example.com` and `second@example.com` are in the roster, and
   the existing staff member's details are unchanged.
5. Upload the same file again. Expect zero additions and all five rows reported.
   Confirm no duplicate staff rows appeared.
6. Upload a corrected file with two new emails. Expect two additions and zero
   rejections. The earlier errors should be replaced by the new result.
7. Upload an empty file, a header-only file, and a file with invalid headers.
   Each should show a readable file error and retain the upload form for retry.
8. Upload a file with a valid row followed by an unterminated quoted field.
   Confirm the file is rejected and its earlier valid row was not saved.
9. In a second disposable course, import an email already used in the first
   course. It should be accepted there.

## Quality Checks

Controller tests cover parsing, authorization, field validation, existing-roster
and within-file duplicates, mixed and zero-added results, and a concurrent
uniqueness failure. Real database tests verify transaction recovery, preservation
of staff/account links, independent courses, case-sensitive matching, and atomic
account attachment. Frontend tests cover upload results, retry, cache refresh,
clearing old results, and disabled controls while a request is pending. Storybook
includes all-valid, mixed-result, all-rejected, and file-error examples.
