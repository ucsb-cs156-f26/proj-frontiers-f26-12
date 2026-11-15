import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { vi } from "vitest";
import OnboardingPreviewPage from "main/pages/Onboarding/OnboardingPreviewPage";
import { apiCurrentUserFixturesWithGithub } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import coursesFixtures from "fixtures/coursesFixtures";

const mockToast = vi.fn();
vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal()),
  toast: (x) => mockToast(x),
}));

const axiosMock = new AxiosMockAdapter(axios);
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// instructorEmail is diba@ucsb.edu, the instructorUser fixture
const course = { ...coursesFixtures.severalCourses[0], id: 7 };

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/onboarding/preview/7"]}>
        <Routes>
          <Route
            path="/onboarding/preview/:courseId"
            element={<OnboardingPreviewPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

const setUser = (user) => axiosMock.onGet("/api/currentUser").reply(200, user);

const progressValue = () =>
  screen.getByRole("progressbar").getAttribute("aria-valuenow");

describe("OnboardingPreviewPage tests", () => {
  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    queryClient.clear();
    sessionStorage.clear();
    mockToast.mockClear();
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.withActiveDirectoryAndGoogle);
  });

  test("shows a loading message until the course arrives", async () => {
    setUser(apiCurrentUserFixturesWithGithub.adminUser);
    axiosMock.onGet("/api/courses/7").reply(200, course);
    renderPage();
    expect(
      screen.getByTestId("OnboardingPreviewPage-loading"),
    ).toHaveTextContent("Loading...");
    await screen.findByTestId("OnboardingPreviewPage-banner");
  });

  test("an admin sees the banner, the stage picker and the first stage", async () => {
    setUser(apiCurrentUserFixturesWithGithub.adminUser);
    axiosMock.onGet("/api/courses/7").reply(200, course);
    renderPage();

    const banner = await screen.findByTestId("OnboardingPreviewPage-banner");
    expect(banner).toHaveClass("alert-info");
    expect(banner).toHaveTextContent("Student onboarding preview");
    expect(banner).toHaveTextContent("CMPSC 156");
    expect(banner).toHaveTextContent("Spring 2025");

    const group = screen.getByRole("group", { name: "Onboarding stage" });
    expect(group.parentElement).toHaveClass(
      "d-flex",
      "flex-wrap",
      "align-items-center",
      "gap-2",
      "mb-3",
    );
    expect(
      screen.getByTestId("OnboardingPreviewPage-stage-school"),
    ).toHaveTextContent("School sign in");
    expect(
      screen.getByTestId("OnboardingPreviewPage-stage-github"),
    ).toHaveTextContent("GitHub sign in");
    expect(
      screen.getByTestId("OnboardingPreviewPage-stage-courses"),
    ).toHaveTextContent("Join courses");
    expect(
      screen.getByTestId("OnboardingPreviewPage-stage-complete"),
    ).toHaveTextContent("Complete");
    expect(
      screen.getByTestId("OnboardingPreviewPage-stage-school"),
    ).toHaveClass("btn-primary");
    expect(
      screen.getByTestId("OnboardingPreviewPage-stage-github"),
    ).toHaveClass("btn-outline-primary");

    expect(screen.getByText("Welcome to Frontiers!")).toBeInTheDocument();
    expect(progressValue()).toBe("25");
    expect(screen.getByRole("progressbar").closest(".row")).toHaveClass(
      "mt-auto",
      "pb-3",
    );
    expect(screen.getByTestId("BasicLayout-container")).toHaveClass(
      "d-flex",
      "flex-column",
    );

    const returnButton = screen.getByTestId("OnboardingPreviewPage-return");
    expect(returnButton).toHaveTextContent("Return to course");
    expect(returnButton).toHaveClass("btn-secondary", "ms-auto");
    await waitFor(() =>
      expect(returnButton).toHaveAttribute("href", "/instructor/courses/7"),
    );
  });

  test("switching stages shows each shared screen with its progress", async () => {
    setUser(apiCurrentUserFixturesWithGithub.adminUser);
    axiosMock.onGet("/api/courses/7").reply(200, course);
    renderPage();
    await screen.findByTestId("OnboardingPreviewPage-banner");

    fireEvent.click(screen.getByTestId("OnboardingPreviewPage-stage-github"));
    expect(
      screen.getByText("Next, you'll need to sign in with GitHub"),
    ).toBeInTheDocument();
    expect(progressValue()).toBe("50");
    expect(
      screen.getByTestId("OnboardingPreviewPage-stage-github"),
    ).toHaveClass("btn-primary");
    expect(
      screen.getByTestId("OnboardingPreviewPage-stage-school"),
    ).toHaveClass("btn-outline-primary");

    fireEvent.click(screen.getByTestId("OnboardingPreviewPage-stage-courses"));
    expect(screen.getByText("Joining Courses")).toBeInTheDocument();
    expect(progressValue()).toBe("75");
    expect(
      screen.getByTestId("OnboardingCoursesTable-cell-row-0-col-courseName"),
    ).toHaveTextContent("CMPSC 156");
    expect(
      screen.getByTestId(
        "OnboardingCoursesTable-cell-row-0-col-studentStatus-button",
      ),
    ).toHaveTextContent("Join Course");

    fireEvent.click(screen.getByTestId("OnboardingPreviewPage-stage-complete"));
    expect(screen.getByText("Complete!")).toBeInTheDocument();
    expect(progressValue()).toBe("100");

    fireEvent.click(screen.getByTestId("OnboardingPreviewPage-stage-school"));
    expect(screen.getByText("Welcome to Frontiers!")).toBeInTheDocument();
    expect(progressValue()).toBe("25");
  });

  test("preview controls do not sign in, join or change anything", async () => {
    setUser(apiCurrentUserFixturesWithGithub.adminUser);
    axiosMock.onGet("/api/courses/7").reply(200, course);
    renderPage();
    await screen.findByTestId("OnboardingPreviewPage-banner");

    // school stage
    await screen.findByText(/We need a bit of information from you/);
    fireEvent.change(screen.getByTestId("SelectSchool-typeahead"), {
      target: { value: "University of California, Santa Barbara" },
    });
    fireEvent.click(
      screen.getByText("University of California, Santa Barbara"),
    );
    const schoolLogIn = await screen.findByText("Log In");
    expect(schoolLogIn).not.toHaveAttribute("href");
    fireEvent.click(schoolLogIn);

    // GitHub stage
    fireEvent.click(screen.getByTestId("OnboardingPreviewPage-stage-github"));
    const githubLogIn = screen.getByText("Log In");
    expect(githubLogIn).not.toHaveAttribute("href");
    fireEvent.click(githubLogIn);

    // course stage
    fireEvent.click(screen.getByTestId("OnboardingPreviewPage-stage-courses"));
    fireEvent.click(
      screen.getByTestId(
        "OnboardingCoursesTable-cell-row-0-col-studentStatus-button",
      ),
    );
    const continueButton = screen.getByText("Continue");
    expect(continueButton).not.toHaveAttribute("href");
    fireEvent.click(continueButton);
    expect(screen.getByText("Joining Courses")).toBeInTheDocument();

    // complete stage
    fireEvent.click(screen.getByTestId("OnboardingPreviewPage-stage-complete"));
    const homeButton = screen.getByText("Click here to return home");
    expect(homeButton).not.toHaveAttribute("href");
    fireEvent.click(homeButton);
    expect(screen.getByText("Complete!")).toBeInTheDocument();

    expect(sessionStorage.getItem("redirect")).toBeNull();
    expect(axiosMock.history.put.length).toBe(0);
    expect(axiosMock.history.post.length).toBe(0);
  });

  test("the course's instructor returns to the instructor view", async () => {
    setUser(apiCurrentUserFixturesWithGithub.instructorUser);
    axiosMock.onGet("/api/courses/7").reply(200, course);
    renderPage();
    const returnButton = await screen.findByTestId(
      "OnboardingPreviewPage-return",
    );
    await waitFor(() =>
      expect(returnButton).toHaveAttribute("href", "/instructor/courses/7"),
    );
  });

  test("course staff return to the staff view", async () => {
    setUser(apiCurrentUserFixturesWithGithub.userOnly);
    axiosMock.onGet("/api/courses/7").reply(200, course);
    renderPage();
    const returnButton = await screen.findByTestId(
      "OnboardingPreviewPage-return",
    );
    await waitFor(() =>
      expect(returnButton).toHaveAttribute("href", "/staff/courses/7"),
    );
  });

  test("users who cannot manage the course are denied", async () => {
    setUser(apiCurrentUserFixturesWithGithub.userOnly);
    axiosMock.onGet("/api/courses/7").reply(403);
    renderPage();
    await screen.findByTestId("OnboardingPreviewPage-denied");
    expect(
      screen.getByText(
        "You do not have access to preview onboarding for this course.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Return")).toHaveAttribute("href", "/");
    expect(
      screen.queryByTestId("OnboardingPreviewPage-banner"),
    ).not.toBeInTheDocument();
    expect(mockToast).not.toHaveBeenCalled();
  });
});
