import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import SignInSuccessPage from "main/pages/Auth/SignInSuccessPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const axiosMock = new AxiosMockAdapter(axios);
let queryClient;
let previousRedirect;

function CurrentRoute() {
  return <output aria-label="Current route">{useLocation().pathname}</output>;
}

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

  test("uses an updated stored destination when the callback rerenders", async () => {
    sessionStorage.setItem("redirect", "/student/courses/7");
    const callback = (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/signin/success"]}>
          <CurrentRoute />
          <SignInSuccessPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    const { rerender } = render(callback);

    await waitFor(() => {
      expect(screen.getByLabelText("Current route")).toHaveTextContent(
        "/student/courses/7",
      );
    });

    // Keep the callback mounted so the next render must use the latest saved path.
    sessionStorage.setItem("redirect", "/profile");
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/signin/success"]}>
          <CurrentRoute />
          <SignInSuccessPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Current route")).toHaveTextContent(
        "/profile",
      );
    });
  });
});
