package edu.ucsb.cs156.frontiers.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.Team;
import edu.ucsb.cs156.frontiers.entities.TeamMember;
import edu.ucsb.cs156.frontiers.repositories.TeamMemberRepository;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class StudentDropServiceTests {

  @Mock private TeamMemberRepository teamMemberRepository;
  @InjectMocks private StudentDropService studentDropService;

  @BeforeEach
  public void setUp() {
    MockitoAnnotations.openMocks(this);
  }

  @Test
  public void removesStudentFromAllTeams() {
    RosterStudent chris = RosterStudent.builder().id(1L).email("chris@example.com").build();
    Team team1 = Team.builder().id(10L).name("t1").teamMembers(new ArrayList<>()).build();
    Team team2 = Team.builder().id(11L).name("t2").teamMembers(new ArrayList<>()).build();
    TeamMember tm1 = TeamMember.builder().id(100L).rosterStudent(chris).team(team1).build();
    TeamMember tm2 = TeamMember.builder().id(101L).rosterStudent(chris).team(team2).build();
    team1.getTeamMembers().add(tm1);
    team2.getTeamMembers().add(tm2);
    chris.setTeamMembers(new ArrayList<>(List.of(tm1, tm2)));

    studentDropService.handleStudentDropped(chris);

    assertTrue(chris.getTeamMembers().isEmpty());
    assertTrue(team1.getTeamMembers().isEmpty());
    assertTrue(team2.getTeamMembers().isEmpty());
    verify(teamMemberRepository).deleteAll(List.of(tm1, tm2));
  }

  @Test
  public void leavesOtherStudentsOnTheTeam() {
    RosterStudent chris = RosterStudent.builder().id(1L).build();
    RosterStudent dana = RosterStudent.builder().id(2L).build();
    Team team = Team.builder().id(10L).teamMembers(new ArrayList<>()).build();
    TeamMember chrisTm = TeamMember.builder().id(100L).rosterStudent(chris).team(team).build();
    TeamMember danaTm = TeamMember.builder().id(101L).rosterStudent(dana).team(team).build();
    team.getTeamMembers().addAll(List.of(chrisTm, danaTm));
    chris.setTeamMembers(new ArrayList<>(List.of(chrisTm)));
    dana.setTeamMembers(new ArrayList<>(List.of(danaTm)));

    studentDropService.handleStudentDropped(chris);

    assertEquals(List.of(danaTm), team.getTeamMembers());
    assertEquals(List.of(danaTm), dana.getTeamMembers());
    verify(teamMemberRepository).deleteAll(List.of(chrisTm));
  }

  @Test
  public void studentWithNullTeamMembersIsNoOp() {
    RosterStudent student = RosterStudent.builder().id(1L).build();
    studentDropService.handleStudentDropped(student);
    verifyNoInteractions(teamMemberRepository);
  }

  @Test
  public void studentWithNoTeamsIsNoOp() {
    RosterStudent student = RosterStudent.builder().id(1L).teamMembers(new ArrayList<>()).build();
    studentDropService.handleStudentDropped(student);
    verify(teamMemberRepository).deleteAll(List.of());
  }

  @Test
  public void handlesMultipleStudents() {
    RosterStudent a = RosterStudent.builder().id(1L).teamMembers(new ArrayList<>()).build();
    RosterStudent b = RosterStudent.builder().id(2L).teamMembers(new ArrayList<>()).build();
    studentDropService.handleStudentsDropped(List.of(a, b));
    verify(teamMemberRepository, times(2)).deleteAll(List.of());
  }
}
