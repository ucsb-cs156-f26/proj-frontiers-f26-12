import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import SignInSuccessPage from "main/pages/Auth/SignInSuccessPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const axiosMock = new AxiosMockAdapter(axios);
let queryClient;
let previousRedirect;

describe("SignInSuccessPage redirects with the real router", () => {
  beforeEach(() => {
    previousRedirect = sessionStorage.getItem("redirect");
    sessionStorage.removeItem("redirect");
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    axiosMock.reset();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    if (previousRedirect === null) {
      sessionStorage.removeItem("redirect");
    } else {
      sessionStorage.setItem("redirect", previousRedirect);
    }
  });

  afterAll(() => axiosMock.restore());

  test.each([
    ["home without a stored path", null, "/"],
    ["the stored return path", "/student/courses/7", "/student/courses/7"],
  ])(
    "navigates to %s after mounting",
    async (_name, storedPath, destination) => {
      if (storedPath) sessionStorage.setItem("redirect", storedPath);

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/signin/success"]}>
            <Routes>
              <Route path="/signin/success" element={<SignInSuccessPage />} />
              <Route path="/" element={<h1>Reached /</h1>} />
              <Route
                path="/student/courses/7"
                element={<h1>Reached /student/courses/7</h1>}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(
        await screen.findByRole("heading", { name: `Reached ${destination}` }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Redirecting...")).not.toBeInTheDocument();
    },
  );
});
