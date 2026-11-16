package edu.ucsb.cs156.frontiers.services;

import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.entities.User;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.repositories.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

/** Keeps the instructor of each course listed as one of that course's staff members. */
@Service
public class InstructorStaffService {

  private final CourseRepository courseRepository;
  private final CourseStaffRepository courseStaffRepository;
  private final UserRepository userRepository;

  public InstructorStaffService(
      CourseRepository courseRepository,
      CourseStaffRepository courseStaffRepository,
      UserRepository userRepository) {
    this.courseRepository = courseRepository;
    this.courseStaffRepository = courseStaffRepository;
    this.userRepository = userRepository;
  }

  /** Adds the course's instructor as a staff member, unless they already are one. */
  public void ensureInstructorIsStaff(Course course) {
    String email = course.getInstructorEmail();
    if (email == null) {
      return;
    }
    if (courseStaffRepository.findByEmailAndCourse(email, course).isPresent()) {
      return;
    }
    Optional<User> user = userRepository.findByEmail(email);
    CourseStaff staff =
        CourseStaff.builder()
            .email(email)
            .firstName(user.map(User::getGivenName).orElse(""))
            .lastName(user.map(User::getFamilyName).orElse(""))
            .user(user.orElse(null))
            .course(course)
            .orgStatus(
                course.getInstallationId() != null ? OrgStatus.JOINCOURSE : OrgStatus.PENDING)
            .build();
    courseStaffRepository.save(staff);
  }

  /** Checks every course and fixes any where the instructor is not a staff member. */
  public void ensureAllInstructorsAreStaff() {
    for (Course course : courseRepository.findAll()) {
      ensureInstructorIsStaff(course);
    }
  }
}
