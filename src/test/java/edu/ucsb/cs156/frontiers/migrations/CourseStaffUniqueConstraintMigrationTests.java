package edu.ucsb.cs156.frontiers.migrations;

import static org.junit.jupiter.api.Assertions.*;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CourseStaffUniqueConstraintMigrationTests {
  private static final String MIGRATION = "030-course-staff-unique-constraint";
  private Connection connection;
  private Liquibase liquibase;

  @BeforeEach
  void setUp() throws Exception {
    connection =
        DriverManager.getConnection(
            "jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=PostgreSQL", "sa", "");
    liquibase =
        new Liquibase(
            "db/migration/changelog-master.json",
            new ClassLoaderResourceAccessor(),
            new JdbcConnection(connection));
  }

  @AfterEach
  void tearDown() throws Exception {
    liquibase.close();
  }

  @Test
  void fresh_database_rejects_same_course_email_without_a_controller_precheck() throws Exception {
    migrate();
    seedCoursesAndUsers();
    insertStaff(1, 10, "staff@example.com", 2);
    var before = staffRows();

    var error = assertThrows(SQLException.class, () -> insertStaff(2, 10, "staff@example.com", 3));

    assertUniqueViolation(error);
    assertEquals(before, staffRows());
  }

  @Test
  void updating_an_existing_row_cannot_create_a_duplicate() throws Exception {
    migrate();
    seedCoursesAndUsers();
    insertStaff(1, 10, "staff@example.com", 2);
    insertStaff(2, 10, "other@example.com", 3);
    var before = staffRows();

    var error =
        assertThrows(
            SQLException.class,
            () -> execute("UPDATE course_staff SET email = 'staff@example.com' WHERE id = 2"));

    assertUniqueViolation(error);
    assertEquals(before, staffRows());
  }

  @Test
  void same_email_in_different_courses_and_case_distinct_emails_are_allowed() throws Exception {
    migrate();
    seedCoursesAndUsers();
    insertStaff(1, 10, "staff@example.com", 2);
    insertStaff(2, 20, "staff@example.com", 2);
    insertStaff(3, 10, "Staff@example.com", 3);

    assertEquals(3, staffRows().size());
  }

  @Test
  void upgrade_preserves_existing_staff_and_account_links() throws Exception {
    migrateBeforeConstraint();
    seedCoursesAndUsers();
    insertStaff(1, 10, "staff@example.com", 2);
    insertStaff(2, 20, "staff@example.com", 2);
    insertStaff(3, 10, "Staff@example.com", 3);
    var before = staffRows();

    migrate();

    assertEquals(before, staffRows());
    assertMigrationRecorded(1);
    assertUniqueViolation(
        assertThrows(SQLException.class, () -> insertStaff(4, 10, "staff@example.com", 2)));
  }

  @Test
  void upgrade_preserves_nullable_legacy_emails() throws Exception {
    migrateBeforeConstraint();
    seedCoursesAndUsers();
    insertStaff(1, 10, null, 2);
    insertStaff(2, 10, null, 3);
    var before = staffRows();

    migrate();

    assertEquals(before, staffRows());
    assertMigrationRecorded(1);
  }

  @ParameterizedTest
  @ValueSource(ints = {2, 3})
  void duplicate_upgrade_halts_without_losing_matching_or_conflicting_account_links(int secondUser)
      throws Exception {
    migrateBeforeConstraint();
    seedCoursesAndUsers();
    insertStaff(1, 10, "staff@example.com", 2);
    insertStaff(2, 10, "staff@example.com", secondUser);
    insertStaff(3, 20, "staff@example.com", 2);
    var before = staffRows();

    var error = assertThrows(LiquibaseException.class, this::migrate);

    assertTrue(error.getMessage().contains("Duplicate COURSE_STAFF rows"));
    assertTrue(error.getMessage().contains("docs/README_Course_Staff_Uniqueness.md"));
    assertEquals(before, staffRows());
    assertMigrationRecorded(0);

    // Simulate an operator's explicit correction, keeping both records and their account links.
    execute("UPDATE course_staff SET email = 'corrected@example.com' WHERE id = 2");
    var corrected = staffRows();
    migrate();

    assertEquals(corrected, staffRows());
    assertMigrationRecorded(1);
    assertUniqueViolation(
        assertThrows(SQLException.class, () -> insertStaff(4, 10, "staff@example.com", 2)));
  }

  private void migrate() throws LiquibaseException {
    liquibase.update(new Contexts(), new LabelExpression());
  }

  private void migrateBeforeConstraint() throws Exception {
    var changes = liquibase.getDatabaseChangeLog().getChangeSets();
    int precedingChanges =
        (int) changes.stream().takeWhile(change -> !MIGRATION.equals(change.getId())).count();
    assertTrue(precedingChanges > 0 && precedingChanges < changes.size());
    liquibase.update(precedingChanges, new Contexts(), new LabelExpression());
    assertMigrationRecorded(0);
  }

  private void seedCoursesAndUsers() throws SQLException {
    execute(
        "INSERT INTO users (id, email) VALUES (1, 'instructor@example.com'),"
            + " (2, 'staff@example.com'), (3, 'other@example.com')");
    execute(
        "INSERT INTO course (id, instructor_email, course_name) VALUES"
            + " (10, 'instructor@example.com', 'Course A'),"
            + " (20, 'instructor@example.com', 'Course B')");
  }

  private void insertStaff(long id, long course, String email, int user) throws SQLException {
    try (var statement =
        connection.prepareStatement(
            "INSERT INTO course_staff"
                + " (id, course_id, email, user_id, github_id, github_login, first_name, last_name,"
                + " org_status, role) VALUES (?, ?, ?, ?, ?, ?, 'Test', 'Staff', 'MEMBER', 'TA')")) {
      statement.setLong(1, id);
      statement.setLong(2, course);
      statement.setString(3, email);
      statement.setInt(4, user);
      statement.setInt(5, 1000 + user);
      statement.setString(6, "staff-github-" + user);
      statement.executeUpdate();
    }
  }

  private List<Map<String, Object>> staffRows() throws SQLException {
    var rows = new ArrayList<Map<String, Object>>();
    try (var statement = connection.createStatement();
        var result = statement.executeQuery("SELECT * FROM course_staff ORDER BY id")) {
      while (result.next()) {
        var row = new LinkedHashMap<String, Object>();
        for (int column = 1; column <= result.getMetaData().getColumnCount(); column++) {
          row.put(result.getMetaData().getColumnName(column), result.getObject(column));
        }
        rows.add(row);
      }
    }
    return rows;
  }

  private void assertMigrationRecorded(int expected) throws SQLException {
    try (var statement =
        connection.prepareStatement("SELECT COUNT(*) FROM databasechangelog WHERE id = ?")) {
      statement.setString(1, MIGRATION);
      try (var result = statement.executeQuery()) {
        assertTrue(result.next());
        assertEquals(expected, result.getInt(1));
      }
    }
  }

  private void assertUniqueViolation(SQLException error) {
    assertEquals("23505", error.getSQLState());
    assertTrue(error.getMessage().contains("UK_COURSE_STAFF_COURSE_EMAIL"));
  }

  private void execute(String sql) throws SQLException {
    try (var statement = connection.createStatement()) {
      statement.executeUpdate(sql);
    }
  }
}
