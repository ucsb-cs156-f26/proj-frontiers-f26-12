import StaffCourseShowPage from "main/pages/Staff/StaffCourseShowPage";
import { apiCurrentUserFixturesWithGithub } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import coursesFixtures from "fixtures/coursesFixtures";
import { rosterStudentFixtures } from "fixtures/rosterStudentFixtures";
import { courseStaffFixtures } from "fixtures/courseStaffFixtures";
import { teamsFixtures } from "fixtures/TeamsFixtures";
import { jobsByCourseFixtures } from "fixtures/jobsByCourseFixtures";
import { courseTabStorageKey } from "main/utils/courseTabUtils";
import { http, HttpResponse } from "msw";
import {
  withRouter,
  reactRouterParameters,
} from "storybook-addon-remix-react-router";

const course = { ...coursesFixtures.oneCourseWithEachStatus[0], id: 7 };
const staffUser = {
  ...apiCurrentUserFixturesWithGithub.userOnly,
  user: {
    ...apiCurrentUserFixturesWithGithub.userOnly.user,
    email: "markta@ucsb.edu",
    fullName: "Mark TA",
    givenName: "Mark",
    familyName: "TA",
    githubLogin: "markta",
  },
};

function createScenario(empty) {
  let students;
  let teams;
  let jobs;
  let nextId;
  const staff = empty ? [] : courseStaffFixtures.threeStaff;

  const reset = () => {
    students = structuredClone(
      empty ? [] : rosterStudentFixtures.threeStudents,
    );
    teams = empty
      ? []
      : [
          {
            ...teamsFixtures.teams[0],
            teamMembers: [
              {
                id: 4,
                rosterStudent: { ...students[0], course },
                teamStatus: "TEAM_MEMBER",
              },
            ],
          },
          { ...teamsFixtures.staffTeam, teamMembers: [] },
        ];
    jobs = structuredClone(empty ? [] : jobsByCourseFixtures.threeJobs).map(
      (job) => ({ ...job, scopeId: 7 }),
    );
    nextId = 100;
  };
  reset();

  const launchJob = ({ request, params }) => {
    const job = {
      ...jobsByCourseFixtures.oneJob[0],
      id: nextId++,
      jobName: params.jobName || new URL(request.url).pathname.split("/").pop(),
      scopeId: 7,
      status: "queued",
      log: "Mock job queued in Storybook; no external work is performed.",
    };
    jobs = [...jobs, job];
    return HttpResponse.json(job);
  };

  return {
    beforeEach: () => {
      reset();
      const key = courseTabStorageKey("7");
      const previousTab = localStorage.getItem(key);
      return () => {
        if (previousTab === null) localStorage.removeItem(key);
        else localStorage.setItem(key, previousTab);
      };
    },
    parameters: {
      msw: {
        handlers: [
          http.get("/api/currentUser", () => HttpResponse.json(staffUser)),
          http.get("/api/systemInfo", () =>
            HttpResponse.json(systemInfoFixtures.showingNeither),
          ),
          http.get("/api/courses/7", () => HttpResponse.json(course)),
          http.get("/api/course/options", () =>
            HttpResponse.json({
              ENABLE_CANVAS: false,
              TRANSLATE_SECTIONS: false,
              DOKKU_MANAGER: false,
              ENABLE_API_KEYS: false,
              SLACK_INTEGRATION: false,
              ENABLE_EDUDORA: false,
              ENABLE_CATME: false,
              NEW_ASSIGNMENT_FEATURES: false,
            }),
          ),
          http.get("/api/courses/warnings/7", () =>
            HttpResponse.json({
              showOrganizationAgeWarning: false,
              showDefaultBasePermissions: false,
              showFreePlanWarning: false,
            }),
          ),
          http.get("/api/rosterstudents/course/7", () =>
            HttpResponse.json(students),
          ),
          http.get("/api/coursestaff/course", () => HttpResponse.json(staff)),
          http.get("/api/teams/all", () => HttpResponse.json(teams)),
          http.get("/api/jobs/course", () => HttpResponse.json(jobs)),
          http.get("/api/courses/slack/info", () =>
            HttpResponse.json({ slackBotToken: "" }),
          ),
          http.get("/api/courses/emails", ({ request }) => {
            const query = new URL(request.url).searchParams;
            const recipients = query.get("type") === "STAFF" ? staff : students;
            return HttpResponse.text(
              recipients
                .map((recipient) => recipient.email)
                .join(query.get("format") === "COMMA_SEPARATED" ? "," : "\r\n"),
            );
          }),
          http.post("/api/rosterstudents/post", ({ request }) => {
            const student = {
              ...Object.fromEntries(new URL(request.url).searchParams),
              id: nextId++,
            };
            students = [...students, student];
            return HttpResponse.json(student);
          }),
          http.put("/api/rosterstudents/update", ({ request }) => {
            const updated = Object.fromEntries(
              new URL(request.url).searchParams,
            );
            students = students.map((student) =>
              student.id === Number(updated.id)
                ? { ...student, ...updated, id: student.id }
                : student,
            );
            return HttpResponse.json(updated);
          }),
          http.delete("/api/rosterstudents/delete", ({ request }) => {
            const id = Number(new URL(request.url).searchParams.get("id"));
            students = students.filter((student) => student.id !== id);
            return HttpResponse.json({ message: "Mock student deleted" });
          }),
          http.post("/api/teams/post", ({ request }) => {
            const query = new URL(request.url).searchParams;
            const team = {
              id: nextId++,
              name: query.get("name"),
              isStaffTeam: query.get("isStaffTeam") === "true",
              teamMembers: [],
              githubTeamId: null,
            };
            teams = [...teams, team];
            return HttpResponse.json(team);
          }),
          http.delete("/api/teams", ({ request }) => {
            const id = Number(new URL(request.url).searchParams.get("id"));
            teams = teams.filter((team) => team.id !== id);
            return HttpResponse.json({ message: "Mock team deleted" });
          }),
          http.post("/api/teams/addMember", ({ request }) => {
            const query = new URL(request.url).searchParams;
            const student = students.find(
              (entry) => entry.id === Number(query.get("rosterStudentId")),
            );
            const member = {
              id: nextId++,
              rosterStudent: student,
              teamStatus: null,
            };
            teams = teams.map((team) =>
              team.id === Number(query.get("teamId"))
                ? { ...team, teamMembers: [...team.teamMembers, member] }
                : team,
            );
            return HttpResponse.json(member);
          }),
          http.delete("/api/teams/removeMember", ({ request }) => {
            const id = Number(
              new URL(request.url).searchParams.get("teamMemberId"),
            );
            teams = teams.map((team) => ({
              ...team,
              teamMembers: team.teamMembers.filter(
                (member) => member.id !== id,
              ),
            }));
            return HttpResponse.json({ message: "Mock team member removed" });
          }),
          http.post("/api/jobs/launch/:jobName", launchJob),
          http.post("/api/repos/createRepos", launchJob),
          http.post("/api/repos/createTeamRepos", launchJob),
          http.post("/api/jobs/:id/cancel", ({ params }) => {
            jobs = jobs.map((job) =>
              job.id === Number(params.id)
                ? { ...job, status: "cancelled" }
                : job,
            );
            return HttpResponse.json({
              message: "Mock cancellation requested",
            });
          }),
          ...["rosterstudents", "teams"].map((resource) =>
            http.post(`/api/${resource}/upload/csv`, () =>
              HttpResponse.json(
                {
                  message: "CSV uploads are not enabled in this story preview.",
                },
                { status: 400 },
              ),
            ),
          ),
        ],
      },
    },
  };
}

export default {
  title: "pages/Staff/StaffCourseShowPage",
  component: StaffCourseShowPage,
  decorators: [withRouter],
  args: { suppressMemoryRouter: true },
  argTypes: { suppressMemoryRouter: { table: { disable: true } } },
  parameters: {
    reactRouter: reactRouterParameters({
      location: {
        pathParams: { id: "7" },
        searchParams: { tab: "students" },
      },
      routing: { path: "/staff/courses/:id" },
    }),
    docs: {
      description: {
        component:
          "Course staff can manage students and teams, but cannot edit staff or access Settings. Mutations update in-memory fixtures; mock GitHub jobs perform no external work. CSV uploads return a preview-only error. Reopen the story to reset its data.",
      },
    },
  },
};

export const PopulatedCourse = {
  render: () => <StaffCourseShowPage />,
  ...createScenario(false),
};

export const EmptyCourse = {
  render: () => <StaffCourseShowPage />,
  ...createScenario(true),
};
