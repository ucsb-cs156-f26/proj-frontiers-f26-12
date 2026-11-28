package edu.ucsb.cs156.frontiers.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.frontiers.ControllerTestCase;
import edu.ucsb.cs156.frontiers.annotations.WithInstructorCoursePermissions;
import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.enums.School;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.services.CourseStaffCsvImportService;
import edu.ucsb.cs156.frontiers.services.CurrentUserService;
import edu.ucsb.cs156.frontiers.services.UpdateUserService;
import jakarta.servlet.ServletException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

@Slf4j
@WebMvcTest(controllers = CourseStaffCSVController.class)
@Import(CourseStaffCsvImportService.class)
public class CourseStaffCSVControllerTests extends ControllerTestCase {

  @MockitoBean private CourseRepository courseRepository;

  @MockitoBean private CourseStaffRepository courseStaffRepository;

  @Autowired private CurrentUserService currentUserService;

  @MockitoBean private UpdateUserService updateUserService;

  @Autowired private ObjectMapper objectMapper;

  private final String sampleCSV =
      """
      firstName,lastName,email
      Chris,Gaucho,cgaucho@example.org
      Lauren,Del Playa,ldelplaya@ucsb.edu
      """;

  private final String sampleCSVWithExtraSpaces =
      """
      firstName,lastName,email
       Chris , Gaucho , cgaucho@example.org
      """;

  @Test
  @WithInstructorCoursePermissions
  public void instructor_can_upload_staff_csv() throws Exception {

    Course course =
        Course.builder()
            .id(1L)
            .courseName("CS156")
            .orgName("ucsb-cs156-s25")
            .term("S25")
            .school(School.UCSB)
            .build();

    when(courseRepository.findById(eq(1L))).thenReturn(Optional.of(course));

    when(courseStaffRepository.saveAndFlush(any(CourseStaff.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "staff.csv", MediaType.TEXT_PLAIN_VALUE, sampleCSV.getBytes());

    MvcResult response =
        mockMvc
            .perform(
                multipart("/api/coursestaff/upload/csv")
                    .file(file)
                    .param("courseId", "1")
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    verify(courseStaffRepository, times(2)).saveAndFlush(any(CourseStaff.class));
    verify(updateUserService, times(2)).attachUserToCourseStaff(any(CourseStaff.class));

    // Verify the saved staff members
    ArgumentCaptor<CourseStaff> captor = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository, times(2)).saveAndFlush(captor.capture());

    CourseStaff first = captor.getAllValues().get(0);
    assertEquals("Chris", first.getFirstName());
    assertEquals("Gaucho", first.getLastName());
    assertEquals("cgaucho@example.org", first.getEmail());
    assertEquals(OrgStatus.PENDING, first.getOrgStatus());

    CourseStaff second = captor.getAllValues().get(1);
    assertEquals("Lauren", second.getFirstName());
    assertEquals("Del Playa", second.getLastName());
    assertEquals("ldelplaya@ucsb.edu", second.getEmail());

    String responseString = response.getResponse().getContentAsString();
    String expectedJson =
        objectMapper.writeValueAsString(Map.of("count", 2, "errors", java.util.List.of()));
    assertEquals(objectMapper.readTree(expectedJson), objectMapper.readTree(responseString));
  }

  @Test
  @WithInstructorCoursePermissions
  public void instructor_can_upload_staff_csv_with_installation_id() throws Exception {

    Course course =
        Course.builder()
            .id(1L)
            .courseName("CS156")
            .orgName("ucsb-cs156-s25")
            .installationId("12345")
            .term("S25")
            .school(School.UCSB)
            .build();

    when(courseRepository.findById(eq(1L))).thenReturn(Optional.of(course));

    when(courseStaffRepository.saveAndFlush(any(CourseStaff.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "staff.csv", MediaType.TEXT_PLAIN_VALUE, sampleCSV.getBytes());

    mockMvc
        .perform(
            multipart("/api/coursestaff/upload/csv").file(file).param("courseId", "1").with(csrf()))
        .andExpect(status().isOk());

    ArgumentCaptor<CourseStaff> captor = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository, times(2)).saveAndFlush(captor.capture());

    // When installationId is present, orgStatus should be JOINCOURSE
    assertEquals(OrgStatus.JOINCOURSE, captor.getAllValues().get(0).getOrgStatus());
    assertEquals(OrgStatus.JOINCOURSE, captor.getAllValues().get(1).getOrgStatus());
  }

  @Test
  @WithInstructorCoursePermissions
  public void upload_strips_whitespace_from_fields() throws Exception {

    Course course =
        Course.builder()
            .id(1L)
            .courseName("CS156")
            .orgName("ucsb-cs156-s25")
            .term("S25")
            .school(School.UCSB)
            .build();

    when(courseRepository.findById(eq(1L))).thenReturn(Optional.of(course));

    when(courseStaffRepository.saveAndFlush(any(CourseStaff.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "staff.csv", MediaType.TEXT_PLAIN_VALUE, sampleCSVWithExtraSpaces.getBytes());

    mockMvc
        .perform(
            multipart("/api/coursestaff/upload/csv").file(file).param("courseId", "1").with(csrf()))
        .andExpect(status().isOk());

    ArgumentCaptor<CourseStaff> captor = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository, times(1)).saveAndFlush(captor.capture());

    CourseStaff saved = captor.getValue();
    assertEquals("Chris", saved.getFirstName());
    assertEquals("Gaucho", saved.getLastName());
    assertEquals("cgaucho@example.org", saved.getEmail());
  }

  @Test
  @WithInstructorCoursePermissions
  public void upload_returns_bad_request_for_invalid_headers() throws Exception {

    Course course =
        Course.builder()
            .id(1L)
            .courseName("CS156")
            .orgName("ucsb-cs156-s25")
            .term("S25")
            .school(School.UCSB)
            .build();

    when(courseRepository.findById(eq(1L))).thenReturn(Optional.of(course));

    String badCSV = "name,address,phone\nChris,123 Main,555-1234\n";

    MockMultipartFile file =
        new MockMultipartFile("file", "staff.csv", MediaType.TEXT_PLAIN_VALUE, badCSV.getBytes());

    mockMvc
        .perform(
            multipart("/api/coursestaff/upload/csv").file(file).param("courseId", "1").with(csrf()))
        .andExpect(status().isBadRequest());

    verify(courseStaffRepository, never()).saveAndFlush(any(CourseStaff.class));
  }

  @Test
  @WithInstructorCoursePermissions
  public void upload_returns_bad_request_for_empty_csv() throws Exception {

    Course course =
        Course.builder()
            .id(1L)
            .courseName("CS156")
            .orgName("ucsb-cs156-s25")
            .term("S25")
            .school(School.UCSB)
            .build();

    when(courseRepository.findById(eq(1L))).thenReturn(Optional.of(course));

    MockMultipartFile file =
        new MockMultipartFile("file", "staff.csv", MediaType.TEXT_PLAIN_VALUE, "".getBytes());

    mockMvc
        .perform(
            multipart("/api/coursestaff/upload/csv").file(file).param("courseId", "1").with(csrf()))
        .andExpect(status().isBadRequest());

    verify(courseStaffRepository, never()).saveAndFlush(any(CourseStaff.class));
  }

  @Test
  @WithInstructorCoursePermissions
  public void upload_reports_short_row_without_rejecting_the_file() throws Exception {

    Course course =
        Course.builder()
            .id(1L)
            .courseName("CS156")
            .orgName("ucsb-cs156-s25")
            .term("S25")
            .school(School.UCSB)
            .build();

    when(courseRepository.findById(eq(1L))).thenReturn(Optional.of(course));

    String shortRowCSV = "firstName,lastName,email\nChris,Gaucho\n";

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "staff.csv", MediaType.TEXT_PLAIN_VALUE, shortRowCSV.getBytes());

    mockMvc
        .perform(
            multipart("/api/coursestaff/upload/csv").file(file).param("courseId", "1").with(csrf()))
        .andExpect(status().isOk())
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.count")
                .value(0))
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath(
                    "$.errors[0].row")
                .value(2))
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath(
                    "$.errors[0].message")
                .value("Expected at least 3 columns: firstName,lastName,email."));
  }

  @Test
  @WithInstructorCoursePermissions
  public void upload_returns_not_found_for_missing_course() throws Exception {

    when(courseRepository.findById(eq(99L))).thenReturn(Optional.empty());

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "staff.csv", MediaType.TEXT_PLAIN_VALUE, sampleCSV.getBytes());

    mockMvc
        .perform(
            multipart("/api/coursestaff/upload/csv")
                .file(file)
                .param("courseId", "99")
                .with(csrf()))
        .andExpect(status().isNotFound());

    verify(courseStaffRepository, never()).saveAndFlush(any(CourseStaff.class));
  }

  @Test
  @WithMockUser(roles = {"USER"})
  public void regular_user_cannot_upload_staff_csv() throws Exception {

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "staff.csv", MediaType.TEXT_PLAIN_VALUE, sampleCSV.getBytes());

    mockMvc
        .perform(
            multipart("/api/coursestaff/upload/csv").file(file).param("courseId", "1").with(csrf()))
        .andExpect(status().isForbidden());

    verify(courseStaffRepository, never()).saveAndFlush(any(CourseStaff.class));
  }

  @Test
  @WithInstructorCoursePermissions
  public void upload_returns_bad_request_for_too_few_headers() throws Exception {

    Course course =
        Course.builder()
            .id(1L)
            .courseName("CS156")
            .orgName("ucsb-cs156-s25")
            .term("S25")
            .school(School.UCSB)
            .build();

    when(courseRepository.findById(eq(1L))).thenReturn(Optional.of(course));

    String fewHeadersCSV = "firstName,lastName\nChris,Gaucho\n";

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "staff.csv", MediaType.TEXT_PLAIN_VALUE, fewHeadersCSV.getBytes());

    mockMvc
        .perform(
            multipart("/api/coursestaff/upload/csv").file(file).param("courseId", "1").with(csrf()))
        .andExpect(status().isBadRequest());

    verify(courseStaffRepository, never()).saveAndFlush(any(CourseStaff.class));
  }

  private Course stubCourse() {
    Course course = Course.builder().id(1L).courseName("CSV review").build();
    when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
    when(courseStaffRepository.saveAndFlush(any(CourseStaff.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
    return course;
  }

  private org.springframework.test.web.servlet.ResultActions upload(String csv) throws Exception {
    return mockMvc.perform(
        multipart("/api/coursestaff/upload/csv")
            .file(
                new MockMultipartFile(
                    "file", "staff.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)))
            .param("courseId", "1")
            .with(csrf()));
  }

  @Test
  @WithInstructorCoursePermissions
  void mixed_rows_save_valid_staff_and_identify_each_rejected_record() throws Exception {
    Course course = stubCourse();
    when(courseStaffRepository.findByEmailAndCourse("existing@example.com", course))
        .thenReturn(Optional.of(CourseStaff.builder().id(99L).firstName("Preserved").build()));

    upload(
            """
        firstName,lastName,email
        New,One,new@example.com
        Existing,Person, existing@example.com
        Repeated,Person, new@example.com
        Missing,Columns
        Invalid,Email,not-an-email
        New,Two,second@example.com
        """)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(2))
        .andExpect(jsonPath("$.errors.length()").value(4))
        .andExpect(jsonPath("$.errors[0].row").value(3))
        .andExpect(jsonPath("$.errors[0].email").value("existing@example.com"))
        .andExpect(
            jsonPath("$.errors[0].message").value("Email is already on this course's staff."))
        .andExpect(jsonPath("$.errors[1].row").value(4))
        .andExpect(jsonPath("$.errors[1].message").value("Email is repeated in this CSV file."))
        .andExpect(jsonPath("$.errors[2].row").value(5))
        .andExpect(jsonPath("$.errors[2].email").value(""))
        .andExpect(jsonPath("$.errors[3].row").value(6))
        .andExpect(jsonPath("$.errors[3].message").value("Enter a valid email address."));

    ArgumentCaptor<CourseStaff> saved = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository, times(2)).saveAndFlush(saved.capture());
    assertEquals(
        java.util.List.of("new@example.com", "second@example.com"),
        saved.getAllValues().stream().map(CourseStaff::getEmail).toList());
    verify(updateUserService, times(2)).attachUserToCourseStaff(any());
  }

  static Stream<Arguments> invalidRows() {
    return Stream.of(
        Arguments.of(" ,Staff,staff@example.com", "First name is required."),
        Arguments.of("First, ,staff@example.com", "Last name is required."),
        Arguments.of("First,Staff, ", "Email is required."),
        Arguments.of(
            "a".repeat(256) + ",Staff,staff@example.com",
            "First name must be at most 255 characters."),
        Arguments.of(
            "First," + "a".repeat(256) + ",staff@example.com",
            "Last name must be at most 255 characters."),
        Arguments.of(
            "First,Staff," + "a".repeat(256) + "@example.com",
            "Email must be at most 255 characters."),
        Arguments.of("First,Staff,staff @example.com", "Enter a valid email address."),
        Arguments.of("First,Staff,staff@@example.com", "Enter a valid email address."));
  }

  @ParameterizedTest
  @MethodSource("invalidRows")
  @WithInstructorCoursePermissions
  void invalid_fields_are_reported_and_a_later_valid_row_is_still_imported(
      String row, String reason) throws Exception {
    stubCourse();
    upload("firstName,lastName,email\n" + row + "\nValid,Staff,valid@example.com\n")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(1))
        .andExpect(jsonPath("$.errors.length()").value(1))
        .andExpect(jsonPath("$.errors[0].row").value(2))
        .andExpect(jsonPath("$.errors[0].message").value(reason));
    verify(courseStaffRepository).saveAndFlush(any(CourseStaff.class));
  }

  @Test
  @WithInstructorCoursePermissions
  void all_rejected_rows_return_zero_count_and_every_error() throws Exception {
    Course course = stubCourse();
    when(courseStaffRepository.findByEmailAndCourse("existing@example.com", course))
        .thenReturn(Optional.of(new CourseStaff()));
    upload("firstName,lastName,email\nExisting,Staff,existing@example.com\nBad,Email,invalid\n")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(0))
        .andExpect(jsonPath("$.errors.length()").value(2));
    verify(courseStaffRepository, never()).saveAndFlush(any());
    verify(updateUserService, never()).attachUserToCourseStaff(any());
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "firstName,lastName,email\n",
        "firstName,lastName,email\nValid,Staff,valid@example.com\n\"unterminated"
      })
  @WithInstructorCoursePermissions
  void file_level_errors_are_clear_and_never_save_earlier_rows(String csv) throws Exception {
    stubCourse();
    upload(csv).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
    verify(courseStaffRepository, never()).saveAndFlush(any());
    verify(updateUserService, never()).attachUserToCourseStaff(any());
  }

  @Test
  @WithInstructorCoursePermissions
  void utf8_quoted_fields_extra_columns_and_case_distinct_emails_still_work() throws Exception {
    stubCourse();
    upload(
            """
         FIRSTNAME , lastName , EMAIL ,ignored
        " Zoë, Jr. ", García , Case@example.com ,extra
        Other,Staff,case@example.com
        """)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(2))
        .andExpect(jsonPath("$.errors").isEmpty());
    ArgumentCaptor<CourseStaff> saved = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository, times(2)).saveAndFlush(saved.capture());
    assertEquals("Zoë, Jr.", saved.getAllValues().get(0).getFirstName());
    assertEquals("García", saved.getAllValues().get(0).getLastName());
    assertEquals("Case@example.com", saved.getAllValues().get(0).getEmail());
  }

  @Test
  @WithInstructorCoursePermissions
  void maximum_length_fields_are_accepted() throws Exception {
    stubCourse();
    upload(
            "firstName,lastName,email\n"
                + "a".repeat(255)
                + ","
                + "b".repeat(255)
                + ","
                + "c".repeat(243)
                + "@example.com\n")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(1))
        .andExpect(jsonPath("$.errors").isEmpty());
  }

  @Test
  @WithInstructorCoursePermissions
  void a_concurrent_duplicate_is_reported_and_later_rows_are_imported() throws Exception {
    Course course = stubCourse();
    when(courseStaffRepository.findByEmailAndCourse("race@example.com", course))
        .thenReturn(Optional.empty(), Optional.of(new CourseStaff()));
    when(courseStaffRepository.saveAndFlush(any(CourseStaff.class)))
        .thenThrow(new DataIntegrityViolationException("duplicate"))
        .thenAnswer(invocation -> invocation.getArgument(0));
    upload(
            "firstName,lastName,email\nConcurrent,Staff,race@example.com\nNew,Staff,new@example.com\n")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(1))
        .andExpect(jsonPath("$.errors[0].row").value(2))
        .andExpect(jsonPath("$.errors[0].email").value("race@example.com"))
        .andExpect(
            jsonPath("$.errors[0].message").value("Email is already on this course's staff."));
    verify(updateUserService).attachUserToCourseStaff(any());
  }

  @Test
  @WithInstructorCoursePermissions
  void unrelated_database_failure_is_not_misreported_as_a_duplicate() {
    stubCourse();
    DataIntegrityViolationException failure = new DataIntegrityViolationException("unrelated");
    when(courseStaffRepository.saveAndFlush(any(CourseStaff.class))).thenThrow(failure);
    ServletException thrown = assertThrows(ServletException.class, () -> upload(sampleCSV));
    assertEquals(failure, thrown.getCause());
    verify(updateUserService, never()).attachUserToCourseStaff(any());
  }
}
