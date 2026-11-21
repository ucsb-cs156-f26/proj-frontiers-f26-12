import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import OnboardingCompleteComponent from "main/components/Onboarding/OnboardingCompleteComponent";

describe("OnboardingCompleteComponent tests", () => {
  test("by default the button links home", () => {
    render(
      <MemoryRouter>
        <OnboardingCompleteComponent />
      </MemoryRouter>,
    );
    expect(screen.getByText("Complete!")).toBeInTheDocument();
    expect(
      screen.getByText("Congratulations on completing the onboarding process!"),
    ).toBeInTheDocument();
    const button = screen.getByText("Click here to return home");
    expect(button).toHaveAttribute("href", "/");
    expect(button.closest(".col-auto")).toHaveClass("text-center");
  });

  test("with onReturnHome the button calls the handler instead", () => {
    const onReturnHome = vi.fn();
    render(
      <MemoryRouter>
        <OnboardingCompleteComponent onReturnHome={onReturnHome} />
      </MemoryRouter>,
    );
    const button = screen.getByText("Click here to return home");
    expect(button).not.toHaveAttribute("href");
    expect(button.closest(".col-auto")).toHaveClass("text-center");
    fireEvent.click(button);
    expect(onReturnHome).toHaveBeenCalledTimes(1);
  });
});
