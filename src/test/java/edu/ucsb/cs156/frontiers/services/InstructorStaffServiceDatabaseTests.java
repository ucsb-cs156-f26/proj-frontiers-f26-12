package edu.ucsb.cs156.frontiers.services;

import static org.junit.jupiter.api.Assertions.*;

import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import java.util.List;
import java.util.Objects;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Runs against a real in-memory database, with no surrounding transaction (like startup). */
@DataJpaTest
@EntityScan(basePackages = {"edu.ucsb.cs156.frontiers.entities", "edu.ucsb.cs156.jobs.entities"})
@Import(InstructorStaffService.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class InstructorStaffServiceDatabaseTests {

  @Autowired private InstructorStaffService instructorStaffService;
  @Autowired private CourseRepository courseRepository;
  @Autowired private CourseStaffRepository courseStaffRepository;

  @AfterEach
  public void cleanUp() {
    courseStaffRepository.deleteAll();
    courseRepository.deleteAll();
  }

  private Course saveCourse(String name, String instructorEmail) {
    return courseRepository.save(
        Course.builder()
            .courseName(name)
            .orgName("test-org")
            .installationId("1")
            .instructorEmail(instructorEmail)
            .term("F26")
            .build());
  }

  private void saveStaff(Course course, String email) {
    courseStaffRepository.save(
        CourseStaff.builder()
            .course(course)
            .email(email)
            .firstName("First")
            .lastName("Last")
            .orgStatus(OrgStatus.PENDING)
            .build());
  }

  private List<CourseStaff> staffOf(Course course) {
    return courseStaffRepository.findAll().stream()
        .filter(s -> Objects.equals(s.getCourse().getId(), course.getId()))
        .toList();
  }

  @Test
  public void duplicateInstructorStaffRowsDoNotStopBackfillOfLaterCourses() {
    Course first = saveCourse("CS1", "prof@ucsb.edu");
    saveStaff(first, "prof@ucsb.edu");
    saveStaff(first, "prof@ucsb.edu"); // duplicate, which the Add Staff endpoint allows
    Course second = saveCourse("CS2", "other@ucsb.edu"); // instructor missing from staff

    assertDoesNotThrow(() -> instructorStaffService.ensureAllInstructorsAreStaff());

    assertEquals(2, staffOf(first).size()); // untouched, no extra row added
    List<CourseStaff> secondStaff = staffOf(second);
    assertEquals(1, secondStaff.size()); // the later course was still reached
    assertEquals("other@ucsb.edu", secondStaff.get(0).getEmail());
  }
}
