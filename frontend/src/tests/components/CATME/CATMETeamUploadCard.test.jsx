import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import CATMETabComponent from "main/components/TabComponent/CATMETabComponent";
import { catmeAuditFixtures } from "fixtures/catmeAuditFixtures";

const url = "/api/catme/createteams";
const file = new File(["CATME team export"], "teams.csv", { type: "text/csv" });
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

async function upload(selectedFile = file) {
  await userEvent.upload(
    screen.getByLabelText("CATME team assignments CSV file"),
    selectedFile,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Upload teams", exact: true }),
  );
}

beforeEach(() => {
  axiosMock = new AxiosMockAdapter(axios);
});
afterEach(() => {
  axiosMock.restore();
});

test("explains team creation and requires a selected export", async () => {
  renderTab();
  const card = within(
    screen.getByRole("region", { name: "CATME team upload" }),
  );
  expect(
    card.getByRole("heading", { name: "Upload Teams from CATME" }),
  ).toBeVisible();
  expect(card.getByText("/faculty/tm_display_results")).toBeVisible();
  expect(card.getByText("Export to CSV")).toBeVisible();
  expect(card.getByText(/preserves existing memberships/)).toBeVisible();
  expect(
    card.getByText(/Students without a team name are skipped/),
  ).toBeVisible();
  expect(
    screen.getByLabelText("CATME team assignments CSV file"),
  ).toHaveAttribute("accept", ".csv,text/csv");
  await userEvent.click(
    card.getByRole("button", { name: "Upload teams", exact: true }),
  );
  expect(card.getByRole("alert")).toHaveTextContent(
    "Choose a CATME TeamMaker CSV file to upload teams.",
  );
  expect(axiosMock.history.post).toHaveLength(0);
});

test("sends a single multipart request and shows the launched job with the correct course Jobs link", async () => {
  axiosMock.onPost(url).reply(200, { message: "Job Launched: 42" });
  renderTab();
  await upload();
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Job Launched: 42. Team creation is running in the background.",
  );
  expect(
    screen.getByRole("link", { name: "View progress in the Jobs tab" }),
  ).toHaveAttribute("href", "/instructor/courses/7?tab=jobs");
  expect(
    screen.queryByRole("region", { name: "CATME audit results" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("No team-creation job was launched."),
  ).not.toBeInTheDocument();
  expect(axiosMock.history.post).toHaveLength(1);
  expect(axiosMock.history.post[0].url).toBe(url);
  expect(axiosMock.history.post[0].params).toEqual({ courseId: 7 });
  expect(axiosMock.history.post[0].data.get("file")).toBe(file);
  expect(axiosMock.history.put).toHaveLength(0);
  expect(axiosMock.history.delete).toHaveLength(0);
});

test("reuses the audit tables for discrepancies and allows a corrected export", async () => {
  axiosMock
    .onPost(url)
    .replyOnce(200, catmeAuditFixtures.differences)
    .onPost(url)
    .reply(200, { message: "Job Launched: 43" });
  renderTab();
  await upload();
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Students to add: 1. Fields to update: 2. Students to remove: 1.",
  );
  expect(screen.getByText("No team-creation job was launched.")).toBeVisible();
  expect(
    screen.getByRole("table", { name: "Fields to update in CATME" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("link", { name: "View progress in the Jobs tab" }),
  ).not.toBeInTheDocument();
  const corrected = new File(["corrected"], "corrected.csv", {
    type: "text/csv",
  });
  await userEvent.upload(
    screen.getByLabelText("CATME team assignments CSV file"),
    corrected,
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Upload teams", exact: true }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Job Launched: 43",
  );
  expect(axiosMock.history.post).toHaveLength(2);
  expect(axiosMock.history.post[1].data.get("file")).toBe(corrected);
});

test("disables upload controls and blocks duplicate submissions while the request is pending", async () => {
  let finish;
  axiosMock.onPost(url).reply(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  renderTab();
  await upload();
  expect(
    await screen.findByRole("button", { name: "Uploading teams…" }),
  ).toBeDisabled();
  expect(
    screen.getByLabelText("CATME team assignments CSV file"),
  ).toBeDisabled();
  const event = new Event("submit", { bubbles: true, cancelable: true });
  fireEvent(screen.getByRole("form", { name: "Upload CATME teams" }), event);
  expect(event.defaultPrevented).toBe(true);
  expect(axiosMock.history.post).toHaveLength(1);
  await act(async () => finish([200, { message: "Job Launched: 44" }]));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Job Launched: 44",
  );
  expect(
    screen.getByRole("button", { name: "Upload teams", exact: true }),
  ).toBeEnabled();
});

test("shows file errors and can retry without changing the selected file", async () => {
  axiosMock
    .onPost(url)
    .replyOnce(422, { message: "Missing team assignments" })
    .onPost(url)
    .reply(200, { message: "Job Launched: 45" });
  renderTab();
  await upload();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Missing team assignments",
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Upload teams", exact: true }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Job Launched: 45",
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("provides a readable network error and clears an old job link", async () => {
  axiosMock
    .onPost(url)
    .replyOnce(200, { message: "Job Launched: 46" })
    .onPost(url)
    .networkError();
  renderTab();
  await upload();
  await screen.findByRole("status");
  await userEvent.click(
    screen.getByRole("button", { name: "Upload teams", exact: true }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unable to upload teams. Please try again.",
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "View progress in the Jobs tab" }),
  ).not.toBeInTheDocument();
});

test("keeps audit and team upload files and results independent", async () => {
  axiosMock.onPost("/api/catme/audit").reply(200, catmeAuditFixtures.clean);
  axiosMock.onPost(url).reply(200, { message: "Job Launched: 47" });
  renderTab();
  await userEvent.upload(
    screen.getByLabelText("CATME TeamMaker CSV file"),
    file,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Audit CSV", exact: true }),
  );
  await screen.findByRole("status");
  expect(
    screen.getByLabelText("CATME team assignments CSV file").files,
  ).toHaveLength(0);
  await upload();
  const teamCard = within(
    screen.getByRole("region", { name: "CATME team upload" }),
  );
  expect(await teamCard.findByRole("status")).toHaveTextContent(
    "Job Launched: 47",
  );
  expect(
    within(
      screen.getByRole("region", { name: "CATME roster audit" }),
    ).getByRole("status"),
  ).toHaveTextContent("No additions, updates, or removals were found.");
});

test("clears course-specific uploads and uses the new course for both submission and job link", async () => {
  axiosMock.onPost(url).reply(200, { message: "Job Launched: 48" });
  const { rerender } = renderTab();
  await upload();
  await screen.findByRole("status");
  rerender(<CATMETabComponent courseId={42} testIdPrefix="CATME" />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(
    screen.getByLabelText("CATME team assignments CSV file").files,
  ).toHaveLength(0);
  await upload();
  expect(
    await screen.findByRole("link", { name: "View progress in the Jobs tab" }),
  ).toHaveAttribute("href", "/instructor/courses/42?tab=jobs");
  expect(axiosMock.history.post[1].params).toEqual({ courseId: 42 });
});

test("ignores a team upload response from a course that is no longer selected", async () => {
  let finish;
  axiosMock.onPost(url).reply(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { rerender } = renderTab();
  await upload();
  rerender(<CATMETabComponent courseId={42} testIdPrefix="CATME" />);
  await act(async () => finish([200, { message: "Job Launched: 49" }]));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Upload teams", exact: true }),
  ).toBeEnabled();
});
