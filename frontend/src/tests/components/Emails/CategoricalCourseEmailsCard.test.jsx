import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { beforeEach, describe, expect, test, vi } from "vitest";

import CategoricalCourseEmailsCard from "main/components/Emails/CategoricalCourseEmailsCard";
import {
  EMAIL_FORMATS,
  EMAIL_TYPES,
} from "main/utils/categoricalCourseEmailsUtils";

const mockToast = vi.fn();
vi.mock("react-toastify", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    toast: (x) => mockToast(x),
  };
});

const axiosMock = new AxiosMockAdapter(axios);
const testId = "CategoricalCourseEmailsCard";
const emailsUrl = "/api/courses/emails";
const emailsGetHistory = () =>
  axiosMock.history.get.filter((request) => request.url === emailsUrl);

// const onePerLine = "a@ucsb.edu\r\nb@ucsb.edu\r\nc@ucsb.edu";
// const commaSeparated = "a@ucsb.edu,b@ucsb.edu,c@ucsb.edu";

const studentEmails = ["leroy@ucsb.edu", "linus@ucsb.edu", "luna@ucsb.edu"];
const staffEmails = ["arthur@ucsb.edu", "profalex@ucsb.edu", "amelia@ucsb.edu"];
const studentTeams = { team01: ["leroy@ucsb.edu"], lemons: ["linus@ucsb.edu"] };
const staffTeams = {
  apples: ["arthur@ucsb.edu", "amelia@ucsb.edu"],
  oranges: ["profalex@ucsb.edu"],
};

const renderCard = (props = {}) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoricalCourseEmailsCard courseId={7} {...props} />
    </QueryClientProvider>,
  );
};

describe("CategoricalCourseEmailsCard tests", () => {
  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    mockToast.mockClear();
    axiosMock.onGet(emailsUrl).reply((config) => {
      const format = config.params.format;
      const type = config.params.type;
      const team = config.params.team;
      const studentEmailsList = team ? studentTeams[team] || [] : studentEmails;
      const staffEmailsList = team ? staffTeams[team] || [] : staffEmails;
      const emails =
        type === "ALL"
          ? studentEmailsList.concat(staffEmailsList)
          : type === "STAFF"
            ? staffEmailsList
            : studentEmailsList;
      return [
        200,
        format === "COMMA_SEPARATED" ? emails.join(",") : emails.join("\r\n"),
      ];
    });
  });

  test("renders a card, open by default, titled Emails", async () => {
    renderCard();

    const card = screen.getByTestId(`${testId}-card`);
    expect(card).toHaveClass("card", "mt-4");
    expect(card.querySelector(".accordion")).toHaveClass("accordion-flush");

    const header = screen.getByRole("button", { name: "Emails" });
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId(`${testId}-emails`)).toBeVisible();

    fireEvent.click(header);
    await waitFor(() =>
      expect(header).toHaveAttribute("aria-expanded", "false"),
    );
    fireEvent.click(header);
    await waitFor(() =>
      expect(header).toHaveAttribute("aria-expanded", "true"),
    );
  });

  test("asks for the emails without changing arguments", async () => {
    renderCard();

    await screen.findByText(/Emails/);
    // await waitFor(() => expect(emailsGetHistory().length).toBe(1));

    expect(emailsGetHistory()[0].params).toEqual({
      courseId: 7,
      type: "STUDENTS",
      team: "",
      format: "ONE_PER_LINE",
    });
  });

  test("shows the emails in a read only, monospace, white on black text area", async () => {
    renderCard();

    const textarea = screen.getByTestId(`${testId}-emails`);
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).toHaveAttribute("aria-label", "Emails");
    expect(textarea).toHaveStyle({
      fontFamily: "monospace",
      backgroundColor: "rgb(0, 0, 0)",
      color: "rgb(255, 255, 255)",
    });
    expect(textarea).toHaveValue("");
  });

  test("the type dropdown offers students, staff, and all, Student first", () => {
    renderCard();

    const select = screen.getByTestId(`${testId}-type`);
    expect(screen.getByLabelText("Type")).toBe(select);
    expect(select).toHaveValue("STUDENTS");
    const options = Array.from(select.querySelectorAll("option")).map((o) => [
      o.value,
      o.textContent,
    ]);
    expect(options).toEqual([
      ["STUDENTS", "Students"],
      ["STAFF", "Staff"],
      ["ALL", "All"],
    ]);
    expect(EMAIL_TYPES.map((f) => f.value)).toEqual([
      "STUDENTS",
      "STAFF",
      "ALL",
    ]);
  });

  test("the format dropdown offers One per line and Comma separated, One per line first", () => {
    renderCard();

    const select = screen.getByTestId(`${testId}-format`);
    expect(screen.getByLabelText("Format")).toBe(select);
    expect(select).toHaveValue("ONE_PER_LINE");
    const options = Array.from(select.querySelectorAll("option")).map((o) => [
      o.value,
      o.textContent,
    ]);
    expect(options).toEqual([
      ["ONE_PER_LINE", "One per line"],
      ["COMMA_SEPARATED", "Comma separated"],
    ]);
    expect(EMAIL_FORMATS.map((f) => f.value)).toEqual([
      "ONE_PER_LINE",
      "COMMA_SEPARATED",
    ]);
  });

  test("the format dropdown offers team filtering, empty first", () => {
    renderCard();

    const select = screen.getByTestId(`${testId}-team`);
    expect(screen.getByLabelText("Team")).toBe(select);
    // onChange={(e) => setTeam(e.target.value)}
    // data-testid={`${testIdPrefix}-team`}
    expect(select).toHaveValue("");
    fireEvent.change(select, {
      target: { value: "alberteinstein@ucsb.edu" },
    });
    expect(select).toHaveValue("alberteinstein@ucsb.edu");
  });

  test("choosing all, no team, Comma separated, shows the correct result", async () => {
    renderCard();

    const typeButton = screen.getByTestId(`${testId}-type`);
    const teamButton = screen.getByTestId(`${testId}-team`);
    const formatButton = screen.getByTestId(`${testId}-format`);
    fireEvent.change(typeButton, {
      target: { value: "ALL" },
    });
    fireEvent.change(teamButton, {
      target: { value: "" },
    });
    fireEvent.change(formatButton, {
      target: { value: "COMMA_SEPARATED" },
    });
    await waitFor(() =>
      expect(screen.getByTestId(`${testId}-emails`)).toHaveValue(
        studentEmails.concat(staffEmails).join(","),
      ),
    );
  });

  test("choosing students, team01, Comma separated, shows the correct result", async () => {
    renderCard();

    const typeButton = screen.getByTestId(`${testId}-type`);
    const teamButton = screen.getByTestId(`${testId}-team`);
    const formatButton = screen.getByTestId(`${testId}-format`);
    fireEvent.change(typeButton, {
      target: { value: "STUDENTS" },
    });
    fireEvent.change(teamButton, {
      target: { value: "team01" },
    });
    fireEvent.change(formatButton, {
      target: { value: "COMMA_SEPARATED" },
    });
    await waitFor(() =>
      expect(screen.getByTestId(`${testId}-emails`)).toHaveValue(
        studentTeams["team01"].join(","),
      ),
    );
  });
  test("the Copy button copies the emails to the clipboard and says so", async () => {
    const user = userEvent.setup();
    renderCard();

    const copy = screen.getByTestId(`${testId}-copy`);
    expect(copy).toHaveTextContent("Copy");
    await waitFor(() => expect(copy).not.toBeDisabled());

    await user.click(copy);

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith("Emails copied to the clipboard."),
    );
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(await navigator.clipboard.readText()).toBe(
      studentEmails.join("\r\n"),
    );
  });

  test("the Copy button copies the correct format when that is selected", async () => {
    const user = userEvent.setup();
    renderCard();

    fireEvent.change(screen.getByTestId(`${testId}-format`), {
      target: { value: "COMMA_SEPARATED" },
    });
    await waitFor(() =>
      expect(screen.getByTestId(`${testId}-emails`)).toHaveValue(
        studentEmails.join(","),
      ),
    );
    await user.click(screen.getByTestId(`${testId}-copy`));
    await waitFor(() => expect(mockToast).toHaveBeenCalled());
    expect(await navigator.clipboard.readText()).toBe(studentEmails.join(","));
  });

  test("says so when the emails cannot be copied", async () => {
    const user = userEvent.setup();
    renderCard();
    const copy = screen.getByTestId(`${testId}-copy`);
    await waitFor(() => expect(copy).not.toBeDisabled());
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );

    await user.click(copy);

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        "Unable to copy the emails to the clipboard.",
      ),
    );
    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  test("the Copy button is disabled when there are no emails", async () => {
    axiosMock.reset();
    axiosMock.onGet(emailsUrl).reply(200, "");

    renderCard();

    await waitFor(() => expect(emailsGetHistory().length).toBe(1));
    expect(screen.getByTestId(`${testId}-emails`)).toHaveValue("");
    expect(screen.getByTestId(`${testId}-copy`)).toBeDisabled();
  });

  test("a failed request does not toast and leaves the text area empty", async () => {
    axiosMock.reset();
    axiosMock.onGet(emailsUrl).reply(500);

    renderCard();

    await waitFor(() => expect(emailsGetHistory().length).toBe(1));
    expect(mockToast).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${testId}-emails`)).toHaveValue("");
    expect(screen.getByTestId(`${testId}-copy`)).toBeDisabled();
  });

  test("uses a custom testIdPrefix", () => {
    renderCard({ testIdPrefix: "Custom" });

    expect(screen.getByTestId("Custom-card")).toBeInTheDocument();
    expect(screen.getByTestId("Custom-format")).toBeInTheDocument();
    expect(screen.getByTestId("Custom-emails")).toBeInTheDocument();
    expect(screen.getByTestId("Custom-copy")).toBeInTheDocument();
  });
});
