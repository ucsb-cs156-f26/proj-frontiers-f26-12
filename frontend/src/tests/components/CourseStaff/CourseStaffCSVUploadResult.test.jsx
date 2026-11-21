import { render, screen, within } from "@testing-library/react";
import CourseStaffCSVUploadResult from "main/components/CourseStaff/CourseStaffCSVUploadResult";

describe("Staff CSV upload results", () => {
  test("all-valid imports show the count without a rejection table", () => {
    render(<CourseStaffCSVUploadResult result={{ count: 2, errors: [] }} />);
    expect(screen.getByRole("alert")).toHaveClass("alert-success");
    expect(
      screen.getByRole("heading", { name: "Staff CSV import results" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Staff added: 2. Rows not imported: 0."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  test.each([0, 2])(
    "shows every rejected row when %i staff were added",
    (count) => {
      render(
        <CourseStaffCSVUploadResult
          result={{
            count,
            errors: [
              {
                row: 3,
                email: "existing@example.com",
                message: "Email is already on this course's staff.",
              },
              { row: 5, email: "", message: "Email is required." },
            ],
          }}
        />,
      );
      expect(screen.getByRole("alert")).toHaveClass("alert-warning");
      expect(
        screen.getByText(`Staff added: ${count}. Rows not imported: 2.`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Correct the rows below and upload them again/),
      ).toBeInTheDocument();
      expect(
        screen.getByText("CSV row numbers include the header as row 1."),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("columnheader").map((header) => header.textContent),
      ).toEqual(["CSV row", "Email", "Reason"]);
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(3);
      expect(
        within(rows[1])
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      ).toEqual([
        "3",
        "existing@example.com",
        "Email is already on this course's staff.",
      ]);
      expect(
        within(rows[2])
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      ).toEqual(["5", "Not provided", "Email is required."]);
    },
  );
});
