import { http, HttpResponse } from "msw";
import {
  withRouter,
  reactRouterParameters,
} from "storybook-addon-remix-react-router";
import OnboardingPreviewPage from "main/pages/Onboarding/OnboardingPreviewPage";
import { apiCurrentUserFixturesWithGithub } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import coursesFixtures from "fixtures/coursesFixtures";

export default {
  title: "pages/Onboarding/OnboardingPreviewPage",
  component: OnboardingPreviewPage,
  decorators: [withRouter],
  args: { suppressMemoryRouter: true },
  parameters: {
    reactRouter: reactRouterParameters({
      location: {
        pathParams: { courseId: "7" },
      },
      routing: { path: "/onboarding/preview/:courseId" },
    }),
  },
};

const Template = () => <OnboardingPreviewPage />;

const exampleCourse = { ...coursesFixtures.severalCourses[0], id: 7 };

export const Default = Template.bind({});
Default.parameters = {
  msw: {
    handlers: [
      http.get("/api/currentUser", () => {
        return HttpResponse.json(apiCurrentUserFixturesWithGithub.adminUser);
      }),
      http.get("/api/systemInfo", () => {
        return HttpResponse.json(
          systemInfoFixtures.withActiveDirectoryAndGoogle,
        );
      }),
      http.get("/api/courses/7", () => {
        return HttpResponse.json(exampleCourse);
      }),
    ],
  },
};

export const NoAccess = Template.bind({});
NoAccess.parameters = {
  msw: {
    handlers: [
      http.get("/api/currentUser", () => {
        return HttpResponse.json(apiCurrentUserFixturesWithGithub.userOnly);
      }),
      http.get("/api/systemInfo", () => {
        return HttpResponse.json(systemInfoFixtures.showingNeither);
      }),
      http.get("/api/courses/7", () => {
        return HttpResponse.json({}, { status: 403 });
      }),
    ],
  },
};
