package edu.ucsb.cs156.frontiers.services;

import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.TeamMember;
import edu.ucsb.cs156.frontiers.repositories.TeamMemberRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Single place for everything that must happen when a student is dropped from a course. Currently
 * this removes the student from all teams.
 */
@Service
public class StudentDropService {

  private final TeamMemberRepository teamMemberRepository;

  public StudentDropService(TeamMemberRepository teamMemberRepository) {
    this.teamMemberRepository = teamMemberRepository;
  }

  public void handleStudentsDropped(Collection<RosterStudent> students) {
    for (RosterStudent student : students) {
      handleStudentDropped(student);
    }
  }

  public void handleStudentDropped(RosterStudent student) {
    removeFromTeams(student);
  }

  private void removeFromTeams(RosterStudent student) {
    if (student.getTeamMembers() == null) {
      return;
    }
    List<TeamMember> memberships = new ArrayList<>(student.getTeamMembers());
    for (TeamMember teamMember : memberships) {
      teamMember.getTeam().getTeamMembers().remove(teamMember);
      student.getTeamMembers().remove(teamMember);
    }
    teamMemberRepository.deleteAll(memberships);
  }
}
