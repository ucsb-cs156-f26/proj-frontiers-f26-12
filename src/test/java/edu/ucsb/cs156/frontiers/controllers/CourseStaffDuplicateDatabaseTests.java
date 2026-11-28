package edu.ucsb.cs156.frontiers.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.entities.User;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.repositories.UserRepository;
import edu.ucsb.cs156.frontiers.services.CurrentUserService;
import edu.ucsb.cs156.frontiers.services.OrganizationMemberService;
import edu.ucsb.cs156.frontiers.services.UpdateUserService;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Exercises the real repository transaction and database constraint, rather than a mocked save. */
@DataJpaTest(
    properties = {"spring.liquibase.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
@Import(CourseStaffController.class)
@EntityScan({"edu.ucsb.cs156.frontiers.entities", "edu.ucsb.cs156.jobs.entities"})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class CourseStaffDuplicateDatabaseTests {
  @Autowired private CourseStaffController controller;
  @Autowired private CourseStaffRepository staffRepository;
  @Autowired private CourseRepository courseRepository;
  @Autowired private UserRepository userRepository;
  @MockitoBean private UpdateUserService updateUserService;
  @MockitoBean private OrganizationMemberService organizationMemberService;
  @MockitoBean private CurrentUserService currentUserService;
  @MockitoBean private RoleHierarchy roleHierarchy;

  @Test
  void duplicate_preserves_existing_staff_and_allows_retry_and_other_courses() {
    Course course = courseRepository.save(Course.builder().courseName("Course A").build());
    Course otherCourse = courseRepository.save(Course.builder().courseName("Course B").build());
    User user = userRepository.save(User.builder().email("staff@example.com").build());
    CourseStaff existing =
        staffRepository.save(
            CourseStaff.builder()
                .course(course)
                .email("staff@example.com")
                .firstName("Original")
                .lastName("Staff")
                .user(user)
                .githubId(123)
                .githubLogin("original-staff")
                .orgStatus(OrgStatus.MEMBER)
                .role("TA")
                .build());

    var duplicate =
        controller.postCourseStaff("Replacement", "Name", " staff@example.com ", course.getId());

    assertEquals(HttpStatus.CONFLICT, duplicate.getStatusCode());
    assertEquals(
        Map.of(
            "message",
            "staff@example.com is already on this course's staff. "
                + "Enter a different email address to add another staff member."),
        duplicate.getBody());
    assertEquals(1, staffRepository.count());
    CourseStaff preserved = staffRepository.findById(existing.getId()).orElseThrow();
    assertEquals("Original", preserved.getFirstName());
    assertEquals("Staff", preserved.getLastName());
    assertEquals("staff@example.com", preserved.getEmail());
    assertEquals(user.getId(), preserved.getUser().getId());
    assertEquals(123, preserved.getGithubId());
    assertEquals("original-staff", preserved.getGithubLogin());
    assertEquals(OrgStatus.MEMBER, preserved.getOrgStatus());
    assertEquals("TA", preserved.getRole());
    assertEquals(course.getId(), preserved.getCourse().getId());
    verifyNoInteractions(updateUserService);

    var retry = controller.postCourseStaff("New", "Staff", "new@example.com", course.getId());
    var other =
        controller.postCourseStaff("Other", "Course", "staff@example.com", otherCourse.getId());
    var differentCase =
        controller.postCourseStaff("Case", "Distinct", "Staff@example.com", course.getId());

    assertEquals(HttpStatus.OK, retry.getStatusCode());
    assertEquals(HttpStatus.OK, other.getStatusCode());
    assertEquals(HttpStatus.OK, differentCase.getStatusCode());
    assertEquals(4, staffRepository.count());
    assertTrue(staffRepository.findByEmailAndCourse("new@example.com", course).isPresent());
    assertTrue(staffRepository.findByEmailAndCourse("staff@example.com", otherCourse).isPresent());
    assertTrue(staffRepository.findByEmailAndCourse("Staff@example.com", course).isPresent());
    verify(updateUserService, times(3)).attachUserToCourseStaff(any(CourseStaff.class));
  }
}
