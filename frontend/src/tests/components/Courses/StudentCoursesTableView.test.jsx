import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import coursesFixtures from "fixtures/coursesFixtures";
import { StudentCoursesTableView } from "main/components/Courses/StudentCoursesTable";

const queryClient = new QueryClient();
const courses = coursesFixtures.oneRosterStudentWithEachStatus;

const renderView = (props) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StudentCoursesTableView testid={"PreviewTable"} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("StudentCoursesTableView tests", () => {
  test("renders the supplied courses with links when given a prefix", () => {
    renderView({
      courses,
      joinCallback: vi.fn(),
      isLoading: () => false,
      courseNameLinkPrefix: "/student/courses",
    });
    expect(
      screen.getByTestId("PreviewTable-cell-row-0-col-id"),
    ).toHaveTextContent(String(courses[0].id));
    expect(
      screen.getByTestId("PreviewTable-cell-row-0-col-courseName-link"),
    ).toHaveAttribute("href", `/student/courses/${courses[0].id}`);
  });

  test("without a prefix the course name is plain text", () => {
    renderView({ courses, joinCallback: vi.fn(), isLoading: () => false });
    expect(
      screen.getByTestId("PreviewTable-cell-row-0-col-courseName"),
    ).toHaveTextContent(courses[0].courseName);
    expect(
      screen.queryByTestId("PreviewTable-cell-row-0-col-courseName-link"),
    ).not.toBeInTheDocument();
  });

  test("passes viewInviteCallback to the View Invite button", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const viewInviteCallback = vi.fn();
    renderView({
      courses,
      joinCallback: vi.fn(),
      isLoading: () => false,
      viewInviteCallback,
    });
    const button = screen.getByTestId(
      "PreviewTable-cell-row-2-col-studentStatus-button",
    );
    expect(button).toHaveTextContent("View Invite");
    fireEvent.click(button);
    expect(viewInviteCallback).toHaveBeenCalledTimes(1);
    expect(viewInviteCallback.mock.calls[0][0].row.original).toEqual(
      courses[2],
    );
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  test("renders the empty message when there are no courses", () => {
    renderView({ courses: [], joinCallback: vi.fn(), isLoading: () => false });
    expect(
      screen.getByText("You are not enrolled in any student courses yet."),
    ).toBeInTheDocument();
  });

  test("calls joinCallback with the clicked row", () => {
    const joinCallback = vi.fn();
    renderView({ courses, joinCallback, isLoading: () => false });
    fireEvent.click(
      screen.getByTestId("PreviewTable-cell-row-1-col-studentStatus-button"),
    );
    expect(joinCallback).toHaveBeenCalledTimes(1);
    expect(joinCallback.mock.calls[0][0].row.original).toEqual(courses[1]);
  });

  test("shows the joining state from isLoading", async () => {
    renderView({
      courses,
      joinCallback: vi.fn(),
      isLoading: (cell) => cell.row.index === 1,
    });
    await screen.findByText("Joining...");
  });
});
