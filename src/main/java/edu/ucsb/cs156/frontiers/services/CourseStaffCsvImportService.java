package edu.ucsb.cs156.frontiers.services;

import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CourseStaffCsvImportService {
  private final CourseStaffRepository courseStaffRepository;
  private final UpdateUserService updateUserService;

  // Commit each row independently. A failed insert or account attachment must roll back only this
  // row, and the caller must catch database conflicts after this transaction has rolled back.
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void importStaff(Course course, String firstName, String lastName, String email) {
    CourseStaff staff =
        CourseStaff.builder()
            .course(course)
            .firstName(firstName)
            .lastName(lastName)
            .email(email)
            .orgStatus(
                course.getInstallationId() == null ? OrgStatus.PENDING : OrgStatus.JOINCOURSE)
            .build();
    CourseStaff saved = courseStaffRepository.saveAndFlush(staff);
    updateUserService.attachUserToCourseStaff(saved);
  }
}
