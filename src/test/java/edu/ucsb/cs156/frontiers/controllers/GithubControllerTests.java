package edu.ucsb.cs156.frontiers.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.ucsb.cs156.frontiers.ControllerTestCase;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.User;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.repositories.RosterStudentRepository;
import edu.ucsb.cs156.frontiers.repositories.UserRepository;
import edu.ucsb.cs156.frontiers.services.CurrentUserService;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(controllers = GithubController.class)
public class GithubControllerTests extends ControllerTestCase {

  @MockitoBean private UserRepository userRepository;
  @MockitoBean private RosterStudentRepository rosterStudentRepository;
  @MockitoBean private CourseStaffRepository courseStaffRepository;

  @Autowired private CurrentUserService currentUserService;

  @Test
  public void successfulDisconnect() throws Exception {

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

    MvcResult response =
        mockMvc
            .perform(
                delete("/api/github/disconnect")
                    .with(csrf())
                    .with(
                        oidcLogin()
                            .authorities(
                                new SimpleGrantedAuthority("ROLE_USER"),
                                new SimpleGrantedAuthority("ROLE_GITHUB"))))
            .andExpect(status().isOk())
            .andExpect(authenticated().withRoles("USER"))
            .andReturn();

    verify(userRepository).save(userCaptor.capture());

    assertNull(userCaptor.getValue().getGithubId());
    assertNull(userCaptor.getValue().getGithubLogin());

    Map<String, Object> json = responseToJson(response);
    assertEquals(
        "Disconnected from GitHub. You may now log in with a different account.",
        json.get("message"));
  }

  @Test
  public void disconnectResetsOnlyInvitedRows() throws Exception {
    RosterStudent invitedStudent =
        RosterStudent.builder()
            .orgStatus(OrgStatus.INVITED)
            .githubId(123)
            .githubLogin("wrong-acct")
            .build();
    RosterStudent memberStudent =
        RosterStudent.builder()
            .orgStatus(OrgStatus.MEMBER)
            .githubId(456)
            .githubLogin("right-acct")
            .build();
    CourseStaff invitedStaff =
        CourseStaff.builder()
            .orgStatus(OrgStatus.INVITED)
            .githubId(789)
            .githubLogin("wrong-staff")
            .build();
    CourseStaff ownerStaff =
        CourseStaff.builder()
            .orgStatus(OrgStatus.OWNER)
            .githubId(101)
            .githubLogin("owner-acct")
            .build();

    when(rosterStudentRepository.findAllByUser(any(User.class)))
        .thenReturn(List.of(invitedStudent, memberStudent));
    when(courseStaffRepository.findAllByUser(any(User.class)))
        .thenReturn(List.of(invitedStaff, ownerStaff));

    mockMvc
        .perform(
            delete("/api/github/disconnect")
                .with(csrf())
                .with(
                    oidcLogin()
                        .authorities(
                            new SimpleGrantedAuthority("ROLE_USER"),
                            new SimpleGrantedAuthority("ROLE_GITHUB"))))
        .andExpect(status().isOk());

    assertEquals(OrgStatus.JOINCOURSE, invitedStudent.getOrgStatus());
    assertNull(invitedStudent.getGithubId());
    assertNull(invitedStudent.getGithubLogin());
    assertEquals(OrgStatus.MEMBER, memberStudent.getOrgStatus());
    assertEquals(456, memberStudent.getGithubId());
    assertEquals("right-acct", memberStudent.getGithubLogin());

    assertEquals(OrgStatus.JOINCOURSE, invitedStaff.getOrgStatus());
    assertNull(invitedStaff.getGithubId());
    assertNull(invitedStaff.getGithubLogin());
    assertEquals(OrgStatus.OWNER, ownerStaff.getOrgStatus());
    assertEquals("owner-acct", ownerStaff.getGithubLogin());

    verify(rosterStudentRepository).saveAll(List.of(invitedStudent));
    verify(courseStaffRepository).saveAll(List.of(invitedStaff));
  }
}
