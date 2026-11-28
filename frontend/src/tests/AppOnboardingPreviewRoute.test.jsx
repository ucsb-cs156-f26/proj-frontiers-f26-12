import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import App from "../App";
import {
  apiCurrentUserFixtures,
  apiCurrentUserFixturesWithGithub,
} from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import coursesFixtures from "fixtures/coursesFixtures";

const axiosMock = new AxiosMockAdapter(axios);
const course = { ...coursesFixtures.severalCourses[0], id: 7 };

const renderAppAt = (path) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  window.history.pushState({}, "", path);
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

describe("App routing for /onboarding/preview/:courseId", () => {
  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.withActiveDirectoryAndGoogle);
  });

  afterAll(() => {
    window.history.pushState({}, "", "/");
  });

  test("an admin without a linked GitHub account can open the preview", async () => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock.onGet("/api/courses/7").reply(200, course);
    renderAppAt("/onboarding/preview/7");
    await screen.findByTestId("OnboardingPreviewPage-banner");
    expect(screen.getByText("Welcome to Frontiers!")).toBeInTheDocument();
    expect(
      screen.queryByTestId("HomePageConnectGithub-cardDisplay"),
    ).not.toBeInTheDocument();
  });

  test("course staff without a linked GitHub account can open the preview", async () => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock.onGet("/api/courses/7").reply(200, course);
    renderAppAt("/onboarding/preview/7");
    await screen.findByTestId("OnboardingPreviewPage-banner");
    expect(
      screen.queryByTestId("HomePageConnectGithub-cardDisplay"),
    ).not.toBeInTheDocument();
  });

  test("an unlinked user who cannot manage the course is still denied", async () => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock.onGet("/api/courses/7").reply(403);
    renderAppAt("/onboarding/preview/7");
    await screen.findByTestId("OnboardingPreviewPage-denied");
    expect(
      screen.queryByTestId("OnboardingPreviewPage-banner"),
    ).not.toBeInTheDocument();
  });

  test("a linked admin can still open the preview", async () => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixturesWithGithub.adminUser);
    axiosMock.onGet("/api/courses/7").reply(200, course);
    renderAppAt("/onboarding/preview/7");
    await screen.findByTestId("OnboardingPreviewPage-banner");
  });

  test("signed out viewers are asked to sign in", async () => {
    axiosMock.onGet("/api/currentUser").reply(403);
    renderAppAt("/onboarding/preview/7");
    await screen.findByText("Please sign in before accessing this page.");
    expect(
      screen.queryByTestId("OnboardingPreviewPage-banner"),
    ).not.toBeInTheDocument();
    expect(axiosMock.history.get.some((r) => r.url === "/api/courses/7")).toBe(
      false,
    );
  });

  test("unlinked users still see the GitHub linking page everywhere else", async () => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    renderAppAt("/profile");
    await screen.findByTestId("HomePageConnectGithub-cardDisplay");
  });
});
