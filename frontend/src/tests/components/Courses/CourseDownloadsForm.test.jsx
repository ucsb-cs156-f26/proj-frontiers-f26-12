import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import CourseDownloadsForm from "main/components/Courses/CourseDownloadsForm";

describe("CourseDownloadsForm tests", () => {
  test("submitting calls downloadAction and stops the browser's default form submit", () => {
    const downloadAction = vi.fn();
    render(
      <CourseDownloadsForm
        downloadAction={downloadAction}
        testIdPrefix="CourseDownloadsForm"
      />,
    );

    const form = screen
      .getByTestId("CourseDownloadsForm-downloads-header")
      .closest("form");
    const notPrevented = fireEvent.submit(form);

    expect(downloadAction).toHaveBeenCalledTimes(1);
    expect(notPrevented).toBe(false);
  });
});
