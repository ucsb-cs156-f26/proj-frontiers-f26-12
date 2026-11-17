import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import OnboardingSuccessPage from "main/pages/Onboarding/OnboardingSuccessPage";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

const queryClient = new QueryClient();

// BasicLayout fetches /api/currentUser and /api/systemInfo; without a mock the
// real request fails and react-query keeps retrying (and logging) after the
// test has finished, which makes vitest's worker teardown flaky.
const axiosMock = new AxiosMockAdapter(axios);
axiosMock.onGet("/api/currentUser").reply(200, apiCurrentUserFixtures.userOnly);
axiosMock
  .onGet("/api/systemInfo")
  .reply(200, systemInfoFixtures.showingNeither);

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OnboardingSuccessPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

test("OnboardingSuccessPage static checks", async () => {
  renderPage();
  await screen.findByText(
    /Congratulations on completing the onboarding process!/,
  );
  const container = screen.getByTestId("BasicLayout-container");
  expect(container).toBeInTheDocument();
  expect(container).toHaveClass("pt-4 flex-grow-1 d-flex flex-column");
});

test("OnboardingSuccessPage shows the complete screen and a full progress bar", async () => {
  renderPage();
  await screen.findByText(
    /Congratulations on completing the onboarding process!/,
  );
  expect(screen.getByText("Click here to return home")).toHaveAttribute(
    "href",
    "/",
  );
  const bar = screen.getByRole("progressbar");
  expect(bar).toHaveAttribute("aria-valuenow", "100");
  expect(bar.closest(".row")).toHaveClass("mt-auto", "pb-3");
});
