# Course staff email uniqueness

`UK_COURSE_STAFF_COURSE_EMAIL` allows one staff row per `(course_id, email)`.
The same email can belong to different courses. The database enforces the rule
for inserts and updates, including writes that bypass the controllers.

## Email comparison

The constraint compares the **stored email exactly, including case**, consistent
with the existing repository lookups and the application's H2 and PostgreSQL
databases. `staff@example.com` and `Staff@example.com` remain distinct. This
migration does not lowercase or rewrite existing emails.

The manual-add endpoint already calls Java `String.strip()` on email; the CSV
upload endpoint calls `String.trim()`. Both remove surrounding ASCII whitespace;
`strip()` also handles Unicode whitespace. These existing behaviors are unchanged.
Callers should trim emails before comparing or storing them and compare using
the trimmed, case-sensitive value. This constraint is not a new normalization
rule: a direct database writer must also trim its input. Historical untrimmed
values are not silently rewritten.

The existing email column remains nullable. As with the student-roster constraint,
SQL `NULL` values do not conflict with each other; this change does not add email
validation. Friendly manual-add errors and partial-success CSV feedback belong to
the other subissues of [#24](https://github.com/ucsb-cs156-f26/proj-frontiers-f26-12/issues/24).

## Upgrading a database that already has duplicates

Migration `030-course-staff-unique-constraint` checks for duplicate non-null pairs
before adding the constraint. If it finds any, Liquibase **halts startup** with a
message pointing here. The migration does not delete, merge, or update any staff
or user records, and it is not marked as applied. Even apparently identical rows
require an explicit decision; a lowest-ID-wins cleanup could discard the row that
has the correct user, GitHub account, organization status, or role.

Run this preflight query before deploying to an existing database:

```sql
SELECT course_id, email, COUNT(*) AS staff_count
FROM course_staff
WHERE course_id IS NOT NULL AND email IS NOT NULL
GROUP BY course_id, email
HAVING COUNT(*) > 1
ORDER BY course_id, email;
```

If it returns rows:

1. Back up the database and pause staff writes while resolving the duplicates.
   If this is discovered during deployment, keep the previous release serving
   until the data has been reviewed and the new migration succeeds.
2. Inspect **all fields** of each duplicate group, including the linked users:

   ```sql
   SELECT cs.*, u.email AS linked_user_email,
          u.github_id AS linked_user_github_id,
          u.github_login AS linked_user_github_login
   FROM course_staff cs
   LEFT JOIN users u ON u.id = cs.user_id
   JOIN (
       SELECT course_id, email
       FROM course_staff
       WHERE course_id IS NOT NULL AND email IS NOT NULL
       GROUP BY course_id, email
       HAVING COUNT(*) > 1
   ) duplicates ON duplicates.course_id = cs.course_id
               AND duplicates.email = cs.email
   ORDER BY cs.course_id, cs.email, cs.id;
   ```

3. Resolve each group with the instructor or database owner in a transaction.
   If the records describe the same person, retain the row with the verified
   associations; explicitly preserve any legitimate first/last name, role,
   organization status, `user_id`, `github_id`, and `github_login` from the other
   rows before removing a confirmed redundant row. Inspect references to staff
   IDs before removing a row. Do not delete user accounts or GitHub memberships.
   If the records refer to different people or contain conflicting account
   links, establish the correct course/email for each person and correct only
   the erroneous values. Leave unresolved groups intact and keep the deployment
   blocked rather than guessing which association to discard.
4. Rerun the preflight query and review the corrected records before committing.
   It must return no rows. Restart/redeploy the new release; Liquibase retries
   the pending migration and adds the constraint. Do not mark the migration as
   ran or edit an already-applied migration to bypass the check.

## Regression checks

Run `mvn -Dtest=CourseStaffUniqueConstraintMigrationTests test`. These tests run
the application's real Liquibase changelog against an isolated H2 database. They
check direct insert/update rejection, cross-course reuse, case sensitivity,
nullable legacy values, preservation of existing account links, halting without
data loss for both matching and conflicting duplicates, and successful retry
after an explicit correction. The schema-validation workflow also compares the
entity's unique constraint with the migrated schema.
