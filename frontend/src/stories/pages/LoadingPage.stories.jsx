import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import LoadingPage from "main/pages/LoadingPage";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/LoadingPage",
  component: LoadingPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "LoadingPage currently renders the normal navigation and footer around an empty content area.",
      },
    },
  },
};

const Template = () => <LoadingPage />;

export const SignedOut = Template.bind({});
SignedOut.parameters = {
  msw: {
    handlers: [
      http.get("/api/currentUser", () => {
        return HttpResponse.json([], { status: 403 });
      }),
      http.get("/api/systemInfo", () => {
        return HttpResponse.json(systemInfoFixtures.showingNeither);
      }),
    ],
  },
};

export const SignedIn = Template.bind({});
SignedIn.parameters = {
  msw: {
    handlers: [
      http.get("/api/currentUser", () => {
        return HttpResponse.json(apiCurrentUserFixtures.userOnly);
      }),
      http.get("/api/systemInfo", () => {
        return HttpResponse.json(systemInfoFixtures.showingNeither);
      }),
    ],
  },
};

export const Admin = Template.bind({});
Admin.parameters = {
  msw: {
    handlers: [
      http.get("/api/currentUser", () => {
        return HttpResponse.json(apiCurrentUserFixtures.adminUser);
      }),
      http.get("/api/systemInfo", () => {
        return HttpResponse.json(systemInfoFixtures.showingBoth);
      }),
    ],
  },
};
