package edu.ucsb.cs156.frontiers.controllers;

import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.enums.RepositoryCreationOption;
import edu.ucsb.cs156.frontiers.enums.RepositoryPermissions;
import edu.ucsb.cs156.frontiers.errors.EntityNotFoundException;
import edu.ucsb.cs156.frontiers.errors.NoLinkedOrganizationException;
import edu.ucsb.cs156.frontiers.jobs.CreateStudentOrStaffRepositoriesJob;
import edu.ucsb.cs156.frontiers.jobs.CreateTeamRepositoriesJob;
import edu.ucsb.cs156.frontiers.jobs.DeleteRepoJob;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.services.GithubTeamService;
import edu.ucsb.cs156.frontiers.services.RepositoryService;
import edu.ucsb.cs156.jobs.entities.Job;
import edu.ucsb.cs156.jobs.services.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Repository Controller")
@RestController
@RequestMapping("/api/repos")
public class RepositoryController extends ApiController {

  @Autowired RepositoryService repositoryService;

  @Autowired JobService jobService;

  @Autowired CourseRepository courseRepository;

  @Autowired GithubTeamService githubTeamService;

  /**
   * Fires a job that creates a repo for every RosterStudent with a linked user with a GitHub
   * account.
   *
   * @param courseId ID of course to create repos for
   * @param repoPrefix each repo created will begin with this prefix, followed by a dash and the
   *     student's GitHub username
   * @param isPrivate determines whether the repository being created is private
   * @return the {@link edu.ucsb.cs156.jobs.entities.Job Job} started to create the repos.
   */
  @PostMapping("/createRepos")
  @PreAuthorize("@CourseSecurity.hasManagePermissions(#root, #courseId)")
  public Job createRepos(
      @RequestParam Long courseId,
      @RequestParam String repoPrefix,
      @RequestParam Optional<Boolean> isPrivate,
      @RequestParam RepositoryPermissions permissions,
      @RequestParam(required = false, defaultValue = "STUDENTS_ONLY")
          RepositoryCreationOption creationOption) {
    Course course =
        courseRepository
            .findById(courseId)
            .orElseThrow(() -> new EntityNotFoundException(Course.class, courseId));
    if (course.getOrgName() == null || course.getInstallationId() == null) {
      throw new NoLinkedOrganizationException(course.getCourseName());
    } else {
      CreateStudentOrStaffRepositoriesJob job =
          CreateStudentOrStaffRepositoriesJob.builder()
              .repositoryPrefix(repoPrefix)
              .isPrivate(isPrivate.orElse(false))
              .repositoryService(repositoryService)
              .course(course)
              .permissions(permissions)
              .creationOption(creationOption)
              .build();
      return jobService.runAsJob(job);
    }
  }

  /**
   * Fires a job that creates team repos shared by all TeamMembers of each Team in a Course .
   *
   * @param courseId ID of course to create team repos for
   * @param repoPrefix each team repo created will begin with this prefix, followed by a dash and
   *     the team's name
   * @param isPrivate determines whether the repository being created is private
   * @return the {@link edu.ucsb.cs156.jobs.entities.Job Job} started to create the repos.
   */
  @PostMapping("/createTeamRepos")
  @PreAuthorize("@CourseSecurity.hasManagePermissions(#root, #courseId)")
  public Job createTeamRepos(
      @RequestParam Long courseId,
      @RequestParam String repoPrefix,
      @RequestParam Optional<Boolean> isPrivate,
      @RequestParam Optional<String> teamRegex,
      @RequestParam RepositoryPermissions permissions) {
    Course course =
        courseRepository
            .findById(courseId)
            .orElseThrow(() -> new EntityNotFoundException(Course.class, courseId));
    if (course.getOrgName() == null || course.getInstallationId() == null) {
      throw new NoLinkedOrganizationException(course.getCourseName());
    } else {
      CreateTeamRepositoriesJob job =
          CreateTeamRepositoriesJob.builder()
              .repositoryPrefix(repoPrefix)
              .isPrivate(isPrivate.orElse(false))
              .repositoryService(repositoryService)
              .githubTeamService(githubTeamService)
              .course(course)
              .permissions(permissions)
              .teamRegex(teamRegex.orElse(null))
              .build();
      return jobService.runAsJob(job);
    }
  }

  /**
   * Fires a job that deletes all empty repos matching the prefix in the linked GitHub organization.
   *
   * @param courseId ID of course to delete repos for
   * @param prefix each repo matching this prefix will be checked and deleted if empty
   * @return the {@link edu.ucsb.cs156.jobs.entities.Job Job} started to delete the repos.
   */
  @Operation(
      summary =
          "Fires a job that deletes all empty repos matching the prefix in the linked GitHub organization")
  @DeleteMapping("")
  @PreAuthorize("@CourseSecurity.hasManagePermissions(#root, #courseId)")
  public Job deleteRepos(
      @Parameter(name = "courseId", description = "course id", example = "1") @RequestParam
          Long courseId,
      @Parameter(
              name = "prefix",
              description = "prefix of repo name to match and delete if empty",
              example = "lab01")
          @RequestParam
          String prefix) {
    Course course =
        courseRepository
            .findById(courseId)
            .orElseThrow(() -> new EntityNotFoundException(Course.class, courseId));
    if (course.getOrgName() == null || course.getInstallationId() == null) {
      throw new NoLinkedOrganizationException(course.getCourseName());
    } else {
      DeleteRepoJob job =
          DeleteRepoJob.builder()
              .courseId(courseId)
              .prefix(prefix)
              .courseRepository(courseRepository)
              .repositoryService(repositoryService)
              .build();
      return jobService.runAsJob(job);
    }
  }
}
