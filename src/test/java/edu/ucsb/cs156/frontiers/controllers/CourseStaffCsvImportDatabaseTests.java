package edu.ucsb.cs156.frontiers.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.entities.User;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.models.CourseStaffCsvImportResult;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.repositories.UserRepository;
import edu.ucsb.cs156.frontiers.services.CourseStaffCsvImportService;
import edu.ucsb.cs156.frontiers.services.CurrentUserService;
import edu.ucsb.cs156.frontiers.services.UpdateUserService;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Real commits and constraint failures, without a test transaction hiding rollback behavior. */
@DataJpaTest(
    properties = {"spring.liquibase.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
@Import({
  CourseStaffCSVController.class,
  CourseStaffCsvImportService.class,
  UpdateUserService.class
})
@EntityScan({"edu.ucsb.cs156.frontiers.entities", "edu.ucsb.cs156.jobs.entities"})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class CourseStaffCsvImportDatabaseTests {
  @Autowired private CourseStaffCSVController controller;
  @Autowired private CourseStaffCsvImportService importer;
  @Autowired private CourseRepository courseRepository;
  @Autowired private UserRepository userRepository;
  @MockitoSpyBean private CourseStaffRepository staffRepository;
  @MockitoSpyBean private UpdateUserService updateUserService;
  @MockitoBean private CurrentUserService currentUserService;
  @MockitoBean private RoleHierarchy roleHierarchy;

  @BeforeEach
  void clearDatabase() {
    staffRepository.deleteAll();
    courseRepository.deleteAll();
    userRepository.deleteAll();
  }

  private CourseStaffCsvImportResult upload(Course course, String csv) {
    return controller.uploadStaffCSV(
        course.getId(),
        new MockMultipartFile(
            "file", "staff.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)));
  }

  @Test
  void a_real_constraint_failure_preserves_existing_staff_and_rows_before_and_after_it() {
    Course course = courseRepository.save(Course.builder().courseName("Import course").build());
    User originalUser = userRepository.save(User.builder().email("existing@example.com").build());
    User newUser = userRepository.save(User.builder().email("new@example.com").build());
    CourseStaff existing =
        staffRepository.saveAndFlush(
            CourseStaff.builder()
                .course(course)
                .email("existing@example.com")
                .firstName("Original")
                .lastName("Name")
                .user(originalUser)
                .githubId(123)
                .githubLogin("original-staff")
                .role("TA")
                .orgStatus(OrgStatus.MEMBER)
                .build());

    // Simulate another request inserting between the precheck and save. The insert itself and
    // subsequent lookup use the real database, so this proves recovery after an actual rollback.
    doReturn(Optional.empty(), Optional.of(existing))
        .when(staffRepository)
        .findByEmailAndCourse("existing@example.com", course);

    var result =
        upload(
            course,
            """
        firstName,lastName,email
        New,Staff,new@example.com
        Replacement,Name,existing@example.com
        Last,Staff,last@example.com
        """);

    assertEquals(2, result.count());
    assertEquals(1, result.errors().size());
    assertEquals(3, result.errors().get(0).row());
    assertEquals("Email is already on this course's staff.", result.errors().get(0).message());
    assertEquals(3, staffRepository.count());
    CourseStaff preserved = staffRepository.findById(existing.getId()).orElseThrow();
    assertEquals("Original", preserved.getFirstName());
    assertEquals("Name", preserved.getLastName());
    assertEquals(originalUser.getId(), preserved.getUser().getId());
    assertEquals(123, preserved.getGithubId());
    assertEquals("original-staff", preserved.getGithubLogin());
    assertEquals("TA", preserved.getRole());
    assertEquals(OrgStatus.MEMBER, preserved.getOrgStatus());
    assertEquals(
        newUser.getId(),
        staffRepository
            .findByEmailAndCourse("new@example.com", course)
            .orElseThrow()
            .getUser()
            .getId());
    assertTrue(staffRepository.findByEmailAndCourse("last@example.com", course).isPresent());
  }

  @Test
  void duplicates_within_a_file_are_rejected_but_other_courses_and_case_distinct_emails_work() {
    Course first = courseRepository.save(Course.builder().courseName("First course").build());
    Course second = courseRepository.save(Course.builder().courseName("Second course").build());
    var result =
        upload(
            first,
            """
        firstName,lastName,email
        First,Staff, staff@example.com
        Duplicate,Staff,staff@example.com
        Case,Distinct,Staff@example.com
        """);
    assertEquals(2, result.count());
    assertEquals(1, result.errors().size());
    assertEquals("Email is repeated in this CSV file.", result.errors().get(0).message());
    assertEquals(3, result.errors().get(0).row());

    var otherCourse = upload(second, "firstName,lastName,email\nOther,Course,staff@example.com\n");
    assertEquals(1, otherCourse.count());
    assertTrue(otherCourse.errors().isEmpty());
    assertEquals(3, staffRepository.count());

    var retry = upload(first, "firstName,lastName,email\nChanged,Name,staff@example.com\n");
    assertEquals(0, retry.count());
    assertEquals(1, retry.errors().size());
    assertEquals(
        "First",
        staffRepository
            .findByEmailAndCourse("staff@example.com", first)
            .orElseThrow()
            .getFirstName());
  }

  @Test
  void account_attachment_failure_rolls_back_only_that_row() {
    Course course = courseRepository.save(Course.builder().courseName("Atomic row").build());
    importer.importStaff(course, "Before", "Staff", "before@example.com");
    doThrow(new IllegalStateException("attachment unavailable"))
        .doCallRealMethod()
        .when(updateUserService)
        .attachUserToCourseStaff(any(CourseStaff.class));

    assertThrows(
        IllegalStateException.class,
        () -> importer.importStaff(course, "Failed", "Staff", "failed@example.com"));
    importer.importStaff(course, "After", "Staff", "after@example.com");

    assertTrue(staffRepository.findByEmailAndCourse("failed@example.com", course).isEmpty());
    assertTrue(staffRepository.findByEmailAndCourse("before@example.com", course).isPresent());
    assertTrue(staffRepository.findByEmailAndCourse("after@example.com", course).isPresent());
    assertEquals(2, staffRepository.count());
  }
}
