import ProtectedPage from "main/pages/Auth/ProtectedPage";
import {
  apiCurrentUserFixtures,
  currentUserFixtures,
} from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { delay, http, HttpResponse } from "msw";

const layoutHandlers = (user, loading = false) => [
  http.get("/api/currentUser", async () => {
    if (loading) await delay("infinite");
    return user
      ? HttpResponse.json(user)
      : new HttpResponse(null, { status: 403 });
  }),
  http.get("/api/systemInfo", () =>
    HttpResponse.json(systemInfoFixtures.showingNeither),
  ),
];

export default {
  title: "pages/Auth/ProtectedPage",
  component: ProtectedPage,
  argTypes: {
    component: { control: false },
    currentUser: { control: false },
  },
  args: {
    enforceRole: "ROLE_INSTRUCTOR",
    component: (
      <div className="container py-4">
        <h1>Instructor workspace</h1>
        <p>This protected content is visible to an authorized instructor.</p>
      </div>
    ),
  },
};

const Template = (args) => <ProtectedPage {...args} />;

export const Loading = Template.bind({});
Loading.args = {
  currentUser: { loggedIn: false, root: null, initialData: true },
};
Loading.parameters = {
  msw: { handlers: layoutHandlers(null, true) },
};

export const Authorized = Template.bind({});
Authorized.args = { currentUser: currentUserFixtures.instructorUser };
Authorized.parameters = {
  msw: { handlers: layoutHandlers(apiCurrentUserFixtures.instructorUser) },
};

export const SignedOut = Template.bind({});
SignedOut.args = { currentUser: currentUserFixtures.notLoggedIn };
SignedOut.parameters = { msw: { handlers: layoutHandlers(null) } };

export const AccessDenied = Template.bind({});
AccessDenied.args = { currentUser: currentUserFixtures.userOnly };
AccessDenied.parameters = {
  msw: { handlers: layoutHandlers(apiCurrentUserFixtures.userOnly) },
};
