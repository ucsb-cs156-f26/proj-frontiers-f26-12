import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AxiosMockAdapter from "axios-mock-adapter";
import axios from "axios";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import OnboardingSelectSchoolComponent from "main/components/Onboarding/OnboardingSelectSchoolComponent";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

const queryClient = new QueryClient();
const axiosMock = new AxiosMockAdapter(axios);

const renderComponent = (props = {}) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OnboardingSelectSchoolComponent {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const chooseSchool = async (schoolName) => {
  await screen.findByText(/We need a bit of information from you/);
  fireEvent.change(screen.getByTestId("SelectSchool-typeahead"), {
    target: { value: schoolName },
  });
  fireEvent.click(screen.getByText(schoolName));
};

describe("OnboardingSelectSchoolComponent layout and supplied handlers", () => {
  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    queryClient.clear();
    sessionStorage.clear();
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.withActiveDirectoryAndGoogle);
  });

  test("shows the placeholder and lays out the sign in card", async () => {
    renderComponent();
    expect(
      screen.getByPlaceholderText("Start typing to select a school..."),
    ).toBeInTheDocument();
    await chooseSchool("University of California, Santa Barbara");
    await screen.findByText(/Sign in with Google/);
    expect(
      screen.getByTestId("SignInCard-base-google").closest(".d-flex"),
    ).toHaveClass(
      "text-center",
      "justify-content-center",
      "align-items-center",
      "d-flex",
    );
  });

  test("without onSignIn, the card still links to the real sign in", async () => {
    renderComponent();
    await chooseSchool("University of California, Santa Barbara");
    await screen.findByText(/Sign in with Google/);
    expect(
      within(screen.getByTestId("SignInCard-base-google")).getByText("Log In"),
    ).toHaveAttribute("href");
  });

  test("with onSignIn, Google sign in calls the handler instead of OAuth", async () => {
    const onSignIn = vi.fn();
    renderComponent({ onSignIn });
    await chooseSchool("University of California, Santa Barbara");
    await screen.findByText(/Sign in with Google/);
    const button = within(
      screen.getByTestId("SignInCard-base-google"),
    ).getByText("Log In");
    expect(button).not.toHaveAttribute("href");
    fireEvent.click(button);
    expect(onSignIn).toHaveBeenCalledWith("google");
    expect(sessionStorage.getItem("redirect")).toBeNull();
  });

  test("with onSignIn, Microsoft sign in calls the handler instead of OAuth", async () => {
    const onSignIn = vi.fn();
    renderComponent({ onSignIn });
    await chooseSchool("Oregon State University");
    await screen.findByText(/Sign in with Microsoft/);
    const button = within(
      screen.getByTestId("SignInCard-base-microsoft"),
    ).getByText("Log In");
    expect(button).not.toHaveAttribute("href");
    fireEvent.click(button);
    expect(onSignIn).toHaveBeenCalledWith("microsoft");
    expect(sessionStorage.getItem("redirect")).toBeNull();
  });
});
