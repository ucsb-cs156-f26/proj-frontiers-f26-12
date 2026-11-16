package edu.ucsb.cs156.frontiers.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.entities.User;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.repositories.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class InstructorStaffServiceTests {

  @Mock private CourseRepository courseRepository;
  @Mock private CourseStaffRepository courseStaffRepository;
  @Mock private UserRepository userRepository;
  @InjectMocks private InstructorStaffService instructorStaffService;

  @BeforeEach
  public void setUp() {
    MockitoAnnotations.openMocks(this);
  }

  @Test
  public void addsInstructorWithUserDetailsWhenCourseIsSetUp() {
    Course course =
        Course.builder().id(1L).instructorEmail("prof@ucsb.edu").installationId("123").build();
    User user = User.builder().email("prof@ucsb.edu").givenName("Pat").familyName("Prof").build();
    when(courseStaffRepository.existsByEmailAndCourse("prof@ucsb.edu", course)).thenReturn(false);
    when(userRepository.findByEmail("prof@ucsb.edu")).thenReturn(Optional.of(user));

    instructorStaffService.ensureInstructorIsStaff(course);

    ArgumentCaptor<CourseStaff> captor = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository).save(captor.capture());
    CourseStaff saved = captor.getValue();
    assertEquals("prof@ucsb.edu", saved.getEmail());
    assertEquals("Pat", saved.getFirstName());
    assertEquals("Prof", saved.getLastName());
    assertEquals(user, saved.getUser());
    assertEquals(course, saved.getCourse());
    assertEquals(OrgStatus.JOINCOURSE, saved.getOrgStatus());
  }

  @Test
  public void addsInstructorWithBlankNamesWhenUserHasNotLoggedInAndCourseNotSetUp() {
    Course course = Course.builder().id(1L).instructorEmail("prof@ucsb.edu").build();
    when(courseStaffRepository.existsByEmailAndCourse("prof@ucsb.edu", course)).thenReturn(false);
    when(userRepository.findByEmail("prof@ucsb.edu")).thenReturn(Optional.empty());

    instructorStaffService.ensureInstructorIsStaff(course);

    ArgumentCaptor<CourseStaff> captor = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository).save(captor.capture());
    CourseStaff saved = captor.getValue();
    assertEquals("", saved.getFirstName());
    assertEquals("", saved.getLastName());
    assertNull(saved.getUser());
    assertEquals(OrgStatus.PENDING, saved.getOrgStatus());
  }

  @Test
  public void doesNothingWhenInstructorIsAlreadyStaff() {
    Course course = Course.builder().id(1L).instructorEmail("prof@ucsb.edu").build();
    when(courseStaffRepository.existsByEmailAndCourse("prof@ucsb.edu", course)).thenReturn(true);

    instructorStaffService.ensureInstructorIsStaff(course);

    verify(courseStaffRepository, never()).save(any());
    verifyNoInteractions(userRepository);
  }

  @Test
  public void doesNothingWhenCourseHasNoInstructorEmail() {
    Course course = Course.builder().id(1L).build();

    instructorStaffService.ensureInstructorIsStaff(course);

    verifyNoInteractions(courseStaffRepository);
    verifyNoInteractions(userRepository);
  }

  @Test
  public void ensureAllInstructorsAreStaffChecksEveryCourse() {
    Course c1 = Course.builder().id(1L).instructorEmail("a@ucsb.edu").build();
    Course c2 = Course.builder().id(2L).instructorEmail("b@ucsb.edu").build();
    when(courseRepository.findAll()).thenReturn(List.of(c1, c2));
    when(courseStaffRepository.existsByEmailAndCourse("a@ucsb.edu", c1)).thenReturn(true);
    when(courseStaffRepository.existsByEmailAndCourse("b@ucsb.edu", c2)).thenReturn(false);
    when(userRepository.findByEmail("b@ucsb.edu")).thenReturn(Optional.empty());

    instructorStaffService.ensureAllInstructorsAreStaff();

    ArgumentCaptor<CourseStaff> captor = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository, times(1)).save(captor.capture());
    assertEquals("b@ucsb.edu", captor.getValue().getEmail());
    assertEquals(c2, captor.getValue().getCourse());
  }
}
