import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import OnboardingPreviewPage from "main/pages/Onboarding/OnboardingPreviewPage";
import { apiCurrentUserFixturesWithGithub } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import coursesFixtures from "fixtures/coursesFixtures";

const axiosMock = new AxiosMockAdapter(axios);
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
const course = { ...coursesFixtures.severalCourses[0], id: 7 };

describe("OnboardingPreviewPage sample course name", () => {
  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    queryClient.clear();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixturesWithGithub.adminUser);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.withActiveDirectoryAndGoogle);
    axiosMock.onGet("/api/courses/7").reply(200, course);
  });

  test("clicking the sample course name keeps the preview open", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/onboarding/preview/7"]}>
          <Routes>
            <Route
              path="/onboarding/preview/:courseId"
              element={<OnboardingPreviewPage />}
            />
            <Route
              path="/student/courses/:id"
              element={<p>Real student course page</p>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByTestId("OnboardingPreviewPage-banner");
    fireEvent.click(screen.getByTestId("OnboardingPreviewPage-stage-courses"));

    const nameCell = screen.getByTestId(
      "OnboardingCoursesTable-cell-row-0-col-courseName",
    );
    expect(nameCell).toHaveTextContent("CMPSC 156");
    expect(
      screen.queryByTestId(
        "OnboardingCoursesTable-cell-row-0-col-courseName-link",
      ),
    ).not.toBeInTheDocument();
    expect(nameCell.querySelector("a")).toBeNull();

    fireEvent.click(screen.getByText("CMPSC 156"));
    expect(
      screen.queryByText("Real student course page"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("OnboardingPreviewPage-banner"),
    ).toBeInTheDocument();
    expect(screen.getByText("Joining Courses")).toBeInTheDocument();
  });
});
