package edu.ucsb.cs156.frontiers.services;

import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.TeamMember;
import edu.ucsb.cs156.frontiers.repositories.TeamMemberRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

  @Transactional
  public void handleStudentsDropped(Collection<RosterStudent> students) {
    for (RosterStudent student : students) {
      handleStudentDropped(student);
    }
  }

  @Transactional
  public void handleStudentDropped(RosterStudent student) {
    removeFromTeams(student);
  }

  private void removeFromTeams(RosterStudent student) {
    if (student.getTeamMembers() == null) {
      return;
    }
    List<TeamMember> memberships = new ArrayList<>(student.getTeamMembers());
    for (TeamMember membership : memberships) {
      // Delete through the persistent (managed) copy, removing it from its managed parents first.
      // The parents' collections cascade, so otherwise Hibernate re-saves the deleted row.
      teamMemberRepository
          .findById(membership.getId())
          .ifPresent(
              managed -> {
                managed.getTeam().getTeamMembers().remove(managed);
                managed.getRosterStudent().getTeamMembers().remove(managed);
                teamMemberRepository.delete(managed);
              });
      membership.getTeam().getTeamMembers().remove(membership);
    }
    // Replace the list instead of removing from it: a loaded Hibernate collection keeps a snapshot
    // of its old contents, and merging a detached student whose snapshot still lists the deleted
    // memberships fails with "Unable to find TeamMember".
    student.setTeamMembers(new ArrayList<>());
  }
}
