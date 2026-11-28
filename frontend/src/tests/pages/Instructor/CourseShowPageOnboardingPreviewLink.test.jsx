import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import InstructorCourseShowPage from "main/pages/Instructor/InstructorCourseShowPage";
import StaffCourseShowPage from "main/pages/Staff/StaffCourseShowPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import coursesFixtures from "fixtures/coursesFixtures";

const axiosMock = new AxiosMockAdapter(axios);
const queryClient = new QueryClient();

const renderAt = (path, routePath, element) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("View onboarding as student link on the course pages", () => {
  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    queryClient.clear();
    window.localStorage.clear();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    axiosMock.onGet("/api/course/options").reply(200, {});
    axiosMock.onGet("/api/jobs/course").reply(200, []);
    axiosMock.onGet("/api/courses/warnings/7").reply(200, {
      showOrganizationAgeWarning: false,
    });
    axiosMock.onGet("/api/rosterstudents/course/7").reply(200, []);
    axiosMock.onGet("/api/coursestaff/course?courseId=7").reply(200, []);
    axiosMock.onGet("/api/teams/all?courseId=7").reply(200, []);
    axiosMock.onGet("/api/courses/7").reply(200, {
      ...coursesFixtures.oneCourseWithEachStatus[0],
      id: 7,
    });
  });

  test("the instructor course page links to the preview", async () => {
    renderAt(
      "/instructor/courses/7",
      "/instructor/courses/:id",
      <InstructorCourseShowPage />,
    );
    const link = await screen.findByTestId(
      "InstructorCourseShowPage-onboarding-preview-link",
    );
    expect(link).toHaveTextContent("View onboarding as student");
    expect(link).toHaveAttribute("href", "/onboarding/preview/7");
    expect(link).toHaveClass("btn-outline-primary", "btn-sm", "ms-auto");
  });

  test("the staff course page links to the preview", async () => {
    renderAt("/staff/courses/7", "/staff/courses/:id", <StaffCourseShowPage />);
    const link = await screen.findByTestId(
      "StaffCourseShowPage-onboarding-preview-link",
    );
    expect(link).toHaveAttribute("href", "/onboarding/preview/7");
  });
});
