import StudentCourseShowPage from "main/pages/Student/StudentCourseShowPage";
import { apiCurrentUserFixturesWithGithub } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import coursesFixtures from "fixtures/coursesFixtures";
import { teamsFixtures } from "fixtures/TeamsFixtures";
import { http, HttpResponse } from "msw";
import {
  withRouter,
  reactRouterParameters,
} from "storybook-addon-remix-react-router";

const course = { ...coursesFixtures.oneCourseWithEachStatus[0], id: 7 };
const assignedTeam = teamsFixtures.teams[0];
const student = assignedTeam.teamMembers[0].rosterStudent.user;
const studentUser = {
  ...apiCurrentUserFixturesWithGithub.userOnly,
  user: { ...student, admin: false },
};
const otherTeam = {
  ...teamsFixtures.teams[1],
  name: "other-team",
  teamMembers: teamsFixtures.teams[1].teamMembers.map((member) => ({
    ...member,
    rosterStudent: {
      ...member.rosterStudent,
      email: "another-student@ucsb.edu",
      user: null,
    },
  })),
};

const handlers = (teams) => [
  http.get("/api/currentUser", () => HttpResponse.json(studentUser)),
  http.get("/api/systemInfo", () =>
    HttpResponse.json(systemInfoFixtures.showingNeither),
  ),
  http.get("/api/courses/7", () => HttpResponse.json(course)),
  http.get("/api/teams/all", () => HttpResponse.json(teams)),
];

export default {
  title: "pages/Student/StudentCourseShowPage",
  component: StudentCourseShowPage,
  decorators: [withRouter],
  args: { suppressMemoryRouter: true },
  argTypes: { suppressMemoryRouter: { table: { disable: true } } },
  parameters: {
    reactRouter: reactRouterParameters({
      location: { pathParams: { id: "7" } },
      routing: { path: "/student/courses/:id" },
    }),
  },
};

const Template = () => <StudentCourseShowPage />;

export const AssignedTeam = Template.bind({});
AssignedTeam.parameters = {
  msw: { handlers: handlers([assignedTeam, otherTeam]) },
};

export const EmptyTeams = Template.bind({});
EmptyTeams.parameters = { msw: { handlers: handlers([]) } };

export const OtherTeamsOnly = Template.bind({});
OtherTeamsOnly.parameters = { msw: { handlers: handlers([otherTeam]) } };
