import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import OnboardingGithubSignInComponent from "main/components/Onboarding/OnboardingGithubSignInComponent";

describe("OnboardingGithubSignInComponent layout and supplied handlers", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("lays out the card and the create account button", () => {
    render(
      <MemoryRouter>
        <OnboardingGithubSignInComponent />
      </MemoryRouter>,
    );
    expect(
      screen.getByTestId("SignInCard-base-github").closest(".row"),
    ).toHaveClass(
      "g-5",
      "d-flex",
      "gap-5",
      "justify-content-center",
      "align-items-center",
    );
    const createAccount = screen.getByTestId(
      "OnboardingGithubSignInComponent-createAccount",
    );
    expect(createAccount).toHaveClass("btn-outline-primary");
    expect(createAccount.closest(".col-auto")).toHaveClass("text-center");
    expect(createAccount.closest(".row")).toHaveClass(
      "align-items-center",
      "justify-content-center",
      "py-3",
    );
  });

  test("with onSignIn, Log In calls the handler instead of GitHub OAuth", () => {
    const onSignIn = vi.fn();
    render(
      <MemoryRouter>
        <OnboardingGithubSignInComponent onSignIn={onSignIn} />
      </MemoryRouter>,
    );
    const button = within(
      screen.getByTestId("SignInCard-base-github"),
    ).getByText("Log In");
    expect(button).not.toHaveAttribute("href");
    fireEvent.click(button);
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("redirect")).toBeNull();
  });
});
