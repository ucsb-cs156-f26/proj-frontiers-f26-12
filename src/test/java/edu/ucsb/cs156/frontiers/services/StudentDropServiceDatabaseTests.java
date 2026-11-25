package edu.ucsb.cs156.frontiers.services;

import static org.junit.jupiter.api.Assertions.*;

import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.Team;
import edu.ucsb.cs156.frontiers.entities.TeamMember;
import edu.ucsb.cs156.frontiers.enums.RosterStatus;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.RosterStudentRepository;
import edu.ucsb.cs156.frontiers.repositories.TeamMemberRepository;
import edu.ucsb.cs156.frontiers.repositories.TeamRepository;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Runs against a real (in-memory) database with NO surrounding transaction, to match how the roster
 * upload controllers call the service in production.
 */
@DataJpaTest
@EntityScan(basePackages = {"edu.ucsb.cs156.frontiers.entities", "edu.ucsb.cs156.jobs.entities"})
@Import(StudentDropService.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class StudentDropServiceDatabaseTests {

  @Autowired private StudentDropService studentDropService;
  @Autowired private CourseRepository courseRepository;
  @Autowired private RosterStudentRepository rosterStudentRepository;
  @Autowired private TeamRepository teamRepository;
  @Autowired private TeamMemberRepository teamMemberRepository;

  @AfterEach
  public void cleanUp() {
    teamMemberRepository.deleteAll();
    teamRepository.deleteAll();
    rosterStudentRepository.deleteAll();
    courseRepository.deleteAll();
  }

  private RosterStudent saveStudent(Course course, String studentId, String name, String email) {
    return rosterStudentRepository.save(
        RosterStudent.builder()
            .course(course)
            .studentId(studentId)
            .firstName(name)
            .lastName("Test")
            .email(email)
            .rosterStatus(RosterStatus.ROSTER)
            .build());
  }

  @Test
  public void droppedStudentIsRemovedFromAllTeamsInTheDatabase() {
    Course course =
        courseRepository.save(
            Course.builder()
                .courseName("CS156")
                .orgName("test-org")
                .installationId("1")
                .instructorEmail("prof@ucsb.edu")
                .term("F26")
                .build());
    RosterStudent chris = saveStudent(course, "1", "Chris", "chris@ucsb.edu");
    RosterStudent dana = saveStudent(course, "2", "Dana", "dana@ucsb.edu");
    Team teamA = teamRepository.save(Team.builder().name("Team A").course(course).build());
    Team teamB = teamRepository.save(Team.builder().name("Team B").course(course).build());
    teamMemberRepository.save(TeamMember.builder().team(teamA).rosterStudent(chris).build());
    teamMemberRepository.save(TeamMember.builder().team(teamA).rosterStudent(dana).build());
    teamMemberRepository.save(TeamMember.builder().team(teamB).rosterStudent(chris).build());

    // Same sequence the upload controllers perform: detached entities, then saveAll
    Course loaded = courseRepository.findById(course.getId()).orElseThrow();
    List<RosterStudent> dropped =
        loaded.getRosterStudents().stream()
            .filter(s -> s.getEmail().equals("chris@ucsb.edu"))
            .toList();
    dropped.forEach(s -> s.setRosterStatus(RosterStatus.DROPPED));
    studentDropService.handleStudentsDropped(dropped);
    rosterStudentRepository.saveAll(loaded.getRosterStudents());

    // Reload everything from the database
    List<TeamMember> remaining = teamMemberRepository.findAll();
    assertEquals(1, remaining.size());
    assertEquals("dana@ucsb.edu", remaining.get(0).getRosterStudent().getEmail());
    assertEquals(1, teamRepository.findById(teamA.getId()).orElseThrow().getTeamMembers().size());
    assertTrue(teamRepository.findById(teamB.getId()).orElseThrow().getTeamMembers().isEmpty());

    // Chris is still on the roster, just marked dropped
    assertEquals(
        RosterStatus.DROPPED,
        rosterStudentRepository.findById(chris.getId()).orElseThrow().getRosterStatus());
  }
}
