import AxiosMockAdapter from "axios-mock-adapter";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import coursesFixtures from "fixtures/coursesFixtures";
import OnboardingSelectCoursesComponent from "main/components/Onboarding/OnboardingSelectCoursesComponent";

const axiosMock = new AxiosMockAdapter(axios);
const queryClient = new QueryClient();
const courses = coursesFixtures.oneRosterStudentWithEachStatus;

const renderComponent = (props = {}) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OnboardingSelectCoursesComponent {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const courseListRequests = () =>
  axiosMock.history.get.filter((r) => r.url === "/api/courses/list");

describe("OnboardingSelectCoursesComponent with supplied data", () => {
  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    queryClient.clear();
  });

  test("real flow: Continue links to the success page", async () => {
    axiosMock.onGet("/api/courses/list").reply(200, []);
    renderComponent();
    await screen.findByText("You are not enrolled in any student courses yet.");
    const button = screen.getByText("Continue");
    expect(button).toHaveAttribute("href", "/onboarding/success");
    const col = button.closest(".col-auto");
    expect(col).toHaveClass("text-center");
    expect(col.closest(".row")).toHaveClass(
      "pt-5",
      "justify-content-center",
      "pb-3",
    );
  });

  test("preview: shows supplied courses without fetching", () => {
    renderComponent({ courses });
    expect(
      screen.getByTestId("OnboardingCoursesTable-cell-row-0-col-id"),
    ).toHaveTextContent(String(courses[0].id));
    expect(courseListRequests().length).toBe(0);
  });

  test("preview: join calls the handler and sends no request", () => {
    const onJoinCourse = vi.fn();
    renderComponent({ courses, onJoinCourse });
    fireEvent.click(
      screen.getByTestId(
        "OnboardingCoursesTable-cell-row-1-col-studentStatus-button",
      ),
    );
    expect(onJoinCourse).toHaveBeenCalledTimes(1);
    expect(onJoinCourse.mock.calls[0][0].row.original).toEqual(courses[1]);
    expect(axiosMock.history.put.length).toBe(0);
  });

  test("preview: join without a handler does nothing", () => {
    renderComponent({ courses });
    fireEvent.click(
      screen.getByTestId(
        "OnboardingCoursesTable-cell-row-1-col-studentStatus-button",
      ),
    );
    expect(axiosMock.history.put.length).toBe(0);
    expect(screen.queryByText("Joining...")).not.toBeInTheDocument();
  });

  test("preview: course names are plain text, not links", () => {
    renderComponent({ courses });
    expect(
      screen.getByTestId("OnboardingCoursesTable-cell-row-0-col-courseName"),
    ).toHaveTextContent(courses[0].courseName);
    expect(
      screen.queryByTestId(
        "OnboardingCoursesTable-cell-row-0-col-courseName-link",
      ),
    ).not.toBeInTheDocument();
  });

  test("preview: View Invite calls onViewInvite and opens nothing", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const onViewInvite = vi.fn();
    renderComponent({ courses, onViewInvite });
    fireEvent.click(
      screen.getByTestId(
        "OnboardingCoursesTable-cell-row-2-col-studentStatus-button",
      ),
    );
    expect(onViewInvite).toHaveBeenCalledTimes(1);
    expect(onViewInvite.mock.calls[0][0].row.original).toEqual(courses[2]);
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  test("preview: View Invite without a handler opens nothing", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderComponent({ courses });
    fireEvent.click(
      screen.getByTestId(
        "OnboardingCoursesTable-cell-row-2-col-studentStatus-button",
      ),
    );
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  test("real flow: course names still link to the student course page", async () => {
    axiosMock.onGet("/api/courses/list").reply(200, courses);
    renderComponent();
    const link = await screen.findByTestId(
      "OnboardingCoursesTable-cell-row-0-col-courseName-link",
    );
    expect(link).toHaveAttribute("href", `/student/courses/${courses[0].id}`);
  });

  test("preview: Continue calls onContinue instead of navigating", () => {
    const onContinue = vi.fn();
    renderComponent({ courses, onContinue });
    const button = screen.getByText("Continue");
    expect(button).not.toHaveAttribute("href");
    fireEvent.click(button);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test("preview: empty sample list shows the empty message", () => {
    renderComponent({ courses: [] });
    expect(
      screen.getByText("You are not enrolled in any student courses yet."),
    ).toBeInTheDocument();
    expect(courseListRequests().length).toBe(0);
  });
});
