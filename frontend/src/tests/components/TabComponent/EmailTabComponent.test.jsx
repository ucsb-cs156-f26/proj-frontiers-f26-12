import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import EmailTabComponent from "main/components/TabComponent/EmailTabComponent";

vi.mock("main/components/Emails/CategoricalCourseEmailsCard", () => ({
  default: ({ courseId, testIdPrefix }) => (
    <div
      data-testid="CategoricalCourseEmailsCard"
      data-course-id={courseId}
      data-test-id-prefix={testIdPrefix}
    />
  ),
}));

describe("EmailTabComponent tests", () => {
  test("renders the email card with the tab test id prefix", () => {
    render(
      <EmailTabComponent
        courseId={7}
        testIdPrefix="InstructorCourseShowPage"
      />,
    );

    expect(
      screen.getByTestId("InstructorCourseShowPage-EmailTabComponent"),
    ).toBeInTheDocument();
    const card = screen.getByTestId("CategoricalCourseEmailsCard");
    expect(card).toHaveAttribute("data-course-id", "7");
    expect(card).toHaveAttribute(
      "data-test-id-prefix",
      "InstructorCourseShowPage-EmailTabComponent",
    );
  });
});
