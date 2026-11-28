import SignInSuccessPage from "main/pages/Auth/SignInSuccessPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { http, HttpResponse } from "msw";

function Destination({ title }) {
  const location = useLocation();
  return (
    <div className="container py-4">
      <h1>{title}</h1>
      <p>
        The sign-in redirect reached <code>{location.pathname}</code> in the
        story&apos;s memory router.
      </p>
      <p>This is a story destination placeholder.</p>
    </div>
  );
}

export default {
  title: "pages/Auth/SignInSuccessPage",
  component: SignInSuccessPage,
  args: { suppressMemoryRouter: true, returnPath: null },
  argTypes: {
    suppressMemoryRouter: { table: { disable: true } },
    returnPath: { control: false },
  },
  beforeEach: ({ args }) => {
    const previousRedirect = sessionStorage.getItem("redirect");
    if (args.returnPath) {
      sessionStorage.setItem("redirect", args.returnPath);
    } else {
      sessionStorage.removeItem("redirect");
    }
    return () => {
      if (previousRedirect === null) {
        sessionStorage.removeItem("redirect");
      } else {
        sessionStorage.setItem("redirect", previousRedirect);
      }
    };
  },
  parameters: {
    msw: {
      handlers: [
        http.get("/api/currentUser", () =>
          HttpResponse.json(apiCurrentUserFixtures.userOnly),
        ),
        http.get("/api/systemInfo", () =>
          HttpResponse.json(systemInfoFixtures.showingNeither),
        ),
      ],
    },
  },
};

const Template = () => (
  <MemoryRouter initialEntries={["/signin/success"]}>
    <Routes>
      <Route path="/signin/success" element={<SignInSuccessPage />} />
      <Route path="/" element={<Destination title="Home destination" />} />
      <Route
        path="/student/courses/7"
        element={<Destination title="Stored course destination" />}
      />
    </Routes>
  </MemoryRouter>
);

export const DefaultHomeRedirect = Template.bind({});

export const StoredReturnPath = Template.bind({});
StoredReturnPath.args = { returnPath: "/student/courses/7" };
