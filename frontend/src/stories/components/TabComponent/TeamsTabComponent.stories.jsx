import TeamsTabComponent from "main/components/TabComponent/TeamsTabComponent";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import coursesFixtures from "fixtures/coursesFixtures";
import { rosterStudentFixtures } from "fixtures/rosterStudentFixtures";
import { courseStaffFixtures } from "fixtures/courseStaffFixtures";
import { teamsFixtures } from "fixtures/TeamsFixtures";
import { http, HttpResponse } from "msw";
import { toast } from "react-toastify";

const course = { ...coursesFixtures.oneCourseWithEachStatus[0], id: 7 };
const students = rosterStudentFixtures.threeStudents.map((student, index) => ({
  ...student,
  course,
  githubId: 1000 + index,
  githubLogin: ["alicebrown", "tomhanks", "emmawatson"][index],
  user: { id: 20 + index, email: student.email },
}));
const teams = [
  {
    ...teamsFixtures.teams[0],
    name: "team-alpha",
    teamMembers: students.slice(0, 2).map((student, index) => ({
      id: 40 + index,
      rosterStudent: student,
      teamStatus: "TEAM_MEMBER",
    })),
  },
  {
    ...teamsFixtures.teams[1],
    name: "team-beta",
    teamMembers: [
      { id: 42, rosterStudent: students[2], teamStatus: "TEAM_MEMBER" },
    ],
  },
  teamsFixtures.staffTeam,
];
const studentUser = {
  ...currentUserFixtures.userOnly,
  root: {
    ...currentUserFixtures.userOnly.root,
    user: students[0].user,
  },
};
const importedTeam = {
  id: 90,
  name: "team-csv-example",
  isStaffTeam: false,
  githubTeamId: 9000,
  teamMembers: [
    { id: 91, rosterStudent: students[2], teamStatus: "TEAM_MEMBER" },
  ],
};

export default {
  title: "components/TabComponent/TeamsTabComponent",
  component: TeamsTabComponent,
  args: {
    courseId: course.id,
    testIdPrefix: "TeamsTabComponent",
    currentUser: currentUserFixtures.instructorUser,
    instructorView: true,
    canManageTeams: true,
  },
  argTypes: {
    courseId: { control: false },
    currentUser: { control: false },
    testIdPrefix: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Standalone course teams with instructor management and student membership views. Search alpha and expand the team headers to inspect student or staff members. Add/delete teams and add/remove members update this preview. Duplicate names or members show the existing error dialogs. Uploading any CSV adds team-csv-example (the file is not parsed). Every GitHub job is mocked, and CSV help displays a preview toast. Reopening a story resets its data.",
      },
    },
  },
};

function teamsStory(initialTeams, args = {}) {
  let teamList = structuredClone(initialTeams);
  let nextId = 100;

  return {
    args,
    beforeEach: () => {
      teamList = structuredClone(initialTeams);
      nextId = 100;
      const originalOpen = window.open;
      window.open = (url) => {
        toast(`Storybook preview: would open ${url}`);
        return null;
      };
      return () => {
        window.open = originalOpen;
      };
    },
    parameters: {
      msw: {
        handlers: [
          http.get("/api/teams/all", () => HttpResponse.json(teamList)),
          http.get(`/api/rosterstudents/course/${course.id}`, () =>
            HttpResponse.json(students),
          ),
          http.get("/api/coursestaff/course", () =>
            HttpResponse.json(courseStaffFixtures.threeStaff),
          ),
          http.post("/api/teams/post", ({ request }) => {
            const params = new URL(request.url).searchParams;
            if (teamList.some((team) => team.name === params.get("name"))) {
              return HttpResponse.json({}, { status: 409 });
            }
            const team = {
              id: nextId++,
              name: params.get("name"),
              isStaffTeam: params.get("isStaffTeam") === "true",
              githubTeamId: 9001,
              teamMembers: [],
            };
            teamList = [...teamList, team];
            return HttpResponse.json(team);
          }),
          http.post("/api/teams/upload/csv", () => {
            const existing = teamList.some(
              (team) => team.id === importedTeam.id,
            );
            if (!existing)
              teamList = [...teamList, structuredClone(importedTeam)];
            return HttpResponse.json({
              created: existing ? 0 : 1,
              existing: existing ? 1 : 0,
              rejected: [],
            });
          }),
          http.post("/api/teams/addMember", ({ request }) => {
            const params = new URL(request.url).searchParams;
            const teamId = Number(params.get("teamId"));
            const rosterStudent = students.find(
              (student) => student.id === Number(params.get("rosterStudentId")),
            );
            const team = teamList.find((entry) => entry.id === teamId);
            if (!team || !rosterStudent) {
              return HttpResponse.json(
                { message: "Select an existing team and roster student." },
                { status: 400 },
              );
            }
            if (
              team.teamMembers.some(
                (member) => member.rosterStudent.id === rosterStudent.id,
              )
            ) {
              return HttpResponse.json({}, { status: 409 });
            }
            const member = {
              id: nextId++,
              rosterStudent,
              teamStatus: "TEAM_MEMBER",
            };
            teamList = teamList.map((entry) =>
              entry.id === teamId
                ? { ...entry, teamMembers: [...entry.teamMembers, member] }
                : entry,
            );
            return HttpResponse.json(member);
          }),
          http.delete("/api/teams", ({ request }) => {
            const id = Number(new URL(request.url).searchParams.get("id"));
            teamList = teamList.filter((team) => team.id !== id);
            return HttpResponse.json({});
          }),
          http.delete("/api/teams/removeMember", ({ request }) => {
            const id = Number(
              new URL(request.url).searchParams.get("teamMemberId"),
            );
            teamList = teamList.map((team) => ({
              ...team,
              teamMembers: team.teamMembers.filter(
                (member) => member.id !== id,
              ),
            }));
            return HttpResponse.json({});
          }),
          ...[
            "pushTeamsToGithub",
            "pullTeamsFromGithub",
            "addTeamToGithub",
            "deleteTeamFromGithub",
            "addTeamMemberToGithub",
            "deleteTeamMemberFromGithub",
          ].map((job) =>
            http.post(`/api/jobs/launch/${job}`, () =>
              HttpResponse.json({ id: 501, status: "complete" }),
            ),
          ),
        ],
      },
    },
  };
}

export const InstructorTeams = teamsStory(teams);

export const EmptyTeams = teamsStory([]);

export const StudentTeams = teamsStory(teams, {
  currentUser: studentUser,
  instructorView: false,
  canManageTeams: false,
});

export const StudentWithoutTeam = teamsStory(teams, {
  currentUser: {
    ...studentUser,
    root: {
      ...studentUser.root,
      user: { id: 99, email: "unassigned@ucsb.edu" },
    },
  },
  instructorView: false,
  canManageTeams: false,
});
