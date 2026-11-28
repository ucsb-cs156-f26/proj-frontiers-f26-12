import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import CATMETabComponent from "main/components/TabComponent/CATMETabComponent";
import { catmeAuditFixtures } from "fixtures/catmeAuditFixtures";

const url = "/api/catme/audit";
const file = new File(["synthetic CATME export"], "catme.csv", {
  type: "text/csv",
});
let axiosMock;

function renderTab() {
  const client = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<CATMETabComponent courseId={7} testIdPrefix="CATME" />, {
    wrapper,
  });
}

async function chooseAndAudit(selectedFile = file) {
  await userEvent.upload(
    screen.getByLabelText("CATME TeamMaker CSV file"),
    selectedFile,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Audit CSV", exact: true }),
  );
}

beforeEach(() => {
  axiosMock = new AxiosMockAdapter(axios);
});

afterEach(() => {
  axiosMock.restore();
});

describe("CATME audit upload", () => {
  test("explains the export workflow and validates that a file is selected", async () => {
    renderTab();
    expect(
      screen.getByRole("heading", {
        name: "Audit CATME Teammaker CSV Download",
      }),
    ).toBeVisible();
    const card = within(
      screen.getByRole("region", { name: "CATME roster audit" }),
    );
    expect(card.getByText("/faculty/tm_display_results")).toBeVisible();
    expect(card.getByText("Export to CSV")).toBeVisible();
    expect(
      screen.getByText(
        "This audit does not change either roster or create teams.",
      ),
    ).toBeVisible();
    expect(screen.getByLabelText("CATME TeamMaker CSV file")).toHaveAttribute(
      "accept",
      ".csv,text/csv",
    );
    expect(
      screen.queryByRole("region", { name: "CATME audit results" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Audit CSV", exact: true }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a CATME TeamMaker CSV file to audit.",
    );
    expect(axiosMock.history.post).toHaveLength(0);
    await userEvent.upload(
      screen.getByLabelText("CATME TeamMaker CSV file"),
      file,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("uploads the selected file for this course and renders the audit without mutating rosters or teams", async () => {
    axiosMock.onPost(url).reply(200, catmeAuditFixtures.differences);
    renderTab();
    await chooseAndAudit();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Students to add: 1. Fields to update: 2. Students to remove: 1.",
    );
    expect(axiosMock.history.post).toHaveLength(1);
    const request = axiosMock.history.post[0];
    expect(request.url).toBe(url);
    expect(request.params).toEqual({ courseId: 7 });
    expect(request.data).toBeInstanceOf(FormData);
    expect(request.data.get("file")).toBe(file);
    expect(axiosMock.history.get).toHaveLength(0);
    expect(axiosMock.history.put).toHaveLength(0);
    expect(axiosMock.history.delete).toHaveLength(0);
  });

  test("keeps form submission on the current page so the upload result is not lost", async () => {
    axiosMock.onPost(url).reply(200, catmeAuditFixtures.clean);
    renderTab();
    await userEvent.upload(
      screen.getByLabelText("CATME TeamMaker CSV file"),
      file,
    );
    const submission = new Event("submit", { bubbles: true, cancelable: true });
    fireEvent(
      screen.getByRole("form", { name: "Audit CATME CSV" }),
      submission,
    );
    // JSDOM does not navigate, so check that the browser's default navigation is canceled.
    expect(submission.defaultPrevented).toBe(true);
    expect(await screen.findByRole("status")).toHaveClass("alert-success");
  });

  test("disables the file and submit controls and prevents a second submission while auditing", async () => {
    let finish;
    axiosMock.onPost(url).reply(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderTab();
    await chooseAndAudit();
    expect(
      await screen.findByRole("button", { name: "Auditing…" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("CATME TeamMaker CSV file")).toBeDisabled();
    fireEvent.submit(screen.getByRole("form", { name: "Audit CATME CSV" }));
    expect(axiosMock.history.post).toHaveLength(1);
    await act(async () => finish([200, catmeAuditFixtures.clean]));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "No additions, updates, or removals were found.",
    );
    expect(
      screen.getByRole("button", { name: "Audit CSV", exact: true }),
    ).toBeEnabled();
    expect(screen.getByLabelText("CATME TeamMaker CSV file")).toBeEnabled();
  });

  test("shows the backend file error and accepts a corrected file without leaving the card", async () => {
    const message =
      "The uploaded file was not in a recognized CATME TeamMaker CSV format.";
    axiosMock
      .onPost(url)
      .replyOnce(422, { message })
      .onPost(url)
      .reply(200, catmeAuditFixtures.clean);
    renderTab();
    await chooseAndAudit();
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(
      screen.queryByRole("region", { name: "CATME audit results" }),
    ).not.toBeInTheDocument();
    const corrected = new File(["corrected export"], "corrected.csv", {
      type: "text/csv",
    });
    await chooseAndAudit(corrected);
    expect(await screen.findByRole("status")).toHaveClass("alert-success");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(axiosMock.history.post).toHaveLength(2);
    expect(axiosMock.history.post[1].data.get("file")).toBe(corrected);
  });

  test.each([undefined, {}])(
    "provides a retryable error when the server has no message (%s)",
    async (data) => {
      axiosMock.onPost(url).reply(500, data);
      renderTab();
      await chooseAndAudit();
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Unable to audit this file. Please try again.",
      );
      expect(
        screen.getByRole("button", { name: "Audit CSV", exact: true }),
      ).toBeEnabled();
    },
  );

  test("allows retrying the same file after a network failure", async () => {
    axiosMock
      .onPost(url)
      .networkErrorOnce()
      .onPost(url)
      .reply(200, catmeAuditFixtures.clean);
    renderTab();
    await chooseAndAudit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to audit this file. Please try again.",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Audit CSV", exact: true }),
    );
    expect(await screen.findByRole("status")).toHaveClass("alert-success");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("clears stale results when changing or clearing the selected file", async () => {
    axiosMock.onPost(url).reply(200, catmeAuditFixtures.differences);
    renderTab();
    await chooseAndAudit();
    await screen.findByRole("status");
    fireEvent.change(screen.getByLabelText("CATME TeamMaker CSV file"), {
      target: { files: [] },
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Audit CSV", exact: true }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a CATME TeamMaker CSV file to audit.",
    );
    expect(axiosMock.history.post).toHaveLength(1);
  });

  test("removes old results during a new audit and keeps them hidden if it fails", async () => {
    axiosMock.onPost(url).replyOnce(200, catmeAuditFixtures.differences);
    let finish;
    axiosMock.onPost(url).reply(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderTab();
    await chooseAndAudit();
    await screen.findByRole("status");
    await userEvent.click(
      screen.getByRole("button", { name: "Audit CSV", exact: true }),
    );
    await screen.findByRole("button", { name: "Auditing…" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await act(async () => finish([422, { message: "Invalid export" }]));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid export",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("resets results and the selected file when switching courses, then uses the new course ID", async () => {
    axiosMock.onPost(url).reply(200, catmeAuditFixtures.clean);
    const { rerender } = renderTab();
    await chooseAndAudit();
    await screen.findByRole("status");
    rerender(<CATMETabComponent courseId={42} testIdPrefix="CATME" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("CATME TeamMaker CSV file").files,
    ).toHaveLength(0);
    await chooseAndAudit();
    await screen.findByRole("status");
    expect(axiosMock.history.post[1].params).toEqual({ courseId: 42 });
  });

  test("does not display an in-flight response from a previous course", async () => {
    let finish;
    axiosMock.onPost(url).reply(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { rerender } = renderTab();
    await chooseAndAudit();
    await waitFor(() => expect(axiosMock.history.post).toHaveLength(1));
    rerender(<CATMETabComponent courseId={42} testIdPrefix="CATME" />);
    await act(async () => finish([200, catmeAuditFixtures.differences]));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Audit CSV", exact: true }),
    ).toBeEnabled();
    expect(
      screen.getByLabelText("CATME TeamMaker CSV file").files,
    ).toHaveLength(0);
  });
});
