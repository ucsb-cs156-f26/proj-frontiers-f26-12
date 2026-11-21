import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import AxiosMockAdapter from "axios-mock-adapter";
import axios from "axios";
import StaffTabComponent from "main/components/TabComponent/StaffTabComponent";
import { currentUserFixtures } from "fixtures/currentUserFixtures";

let axiosMock;
const endpoint = "/api/coursestaff/upload/csv";
const file = new File(
  ["firstName,lastName,email\nNew,Staff,new@example.com\n"],
  "staff.csv",
  { type: "text/csv" },
);

beforeEach(() => {
  axiosMock = new AxiosMockAdapter(axios);
  axiosMock.onGet("/api/coursestaff/course?courseId=7").reply(200, []);
  axiosMock.onGet("/api/courses/emails").reply(200, "");
});

afterEach(() => axiosMock.restore());

function renderStaff() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <StaffTabComponent
          courseId={7}
          testIdPrefix="Staff"
          currentUser={currentUserFixtures.instructorUser}
        />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

async function chooseFile() {
  await userEvent.click(
    await screen.findByRole("button", { name: "Upload Staff CSV" }),
  );
  await userEvent.upload(screen.getByLabelText("Upload Staff CSV"), file);
}

async function submitFile() {
  await userEvent.click(
    screen.getByRole("button", { name: "Upload", exact: true }),
  );
}

test.each([0, 2])(
  "a completed import with %i additions shows row errors and clears the search",
  async (count) => {
    axiosMock.onPost(endpoint).reply(200, {
      count,
      errors: [
        {
          row: 3,
          email: "existing@example.com",
          message: "Email is already on this course's staff.",
        },
      ],
    });
    renderStaff();
    await userEvent.type(
      screen.getByPlaceholderText("Search by name, email, or Github Login"),
      "hidden staff",
    );
    await chooseFile();
    await submitFile();
    expect(
      await screen.findByText(`Staff added: ${count}. Rows not imported: 1.`),
    ).toBeInTheDocument();
    expect(screen.getByText("existing@example.com")).toBeInTheDocument();
    expect(
      screen.getByText("Email is already on this course's staff."),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search by name, email, or Github Login"),
    ).toHaveValue("");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  },
);

test("a file error remains visible and can be corrected with another upload", async () => {
  axiosMock
    .onPost(endpoint)
    .replyOnce(400, { message: "CSV headers do not match expected format." });
  axiosMock.onPost(endpoint).reply(200, { count: 1, errors: [] });
  renderStaff();
  await chooseFile();
  await submitFile();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "CSV headers do not match expected format.",
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(
    screen.queryByText("Staff CSV import results"),
  ).not.toBeInTheDocument();
  await submitFile();
  expect(
    await screen.findByText("Staff added: 1. Rows not imported: 0."),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("CSV headers do not match expected format."),
  ).not.toBeInTheDocument();
  expect(axiosMock.history.post).toHaveLength(2);
});

test.each(["network", "missing data", "missing message"])(
  "a %s failure shows useful retry guidance",
  async (failure) => {
    if (failure === "network") axiosMock.onPost(endpoint).networkError();
    else
      axiosMock
        .onPost(endpoint)
        .reply(500, failure === "missing data" ? undefined : {});
    renderStaff();
    await chooseFile();
    await submitFile();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Upload could not be completed. Check the staff roster before retrying; some rows may have been saved.",
    );
    expect(
      screen.getByRole("button", { name: "Upload", exact: true }),
    ).toBeEnabled();
  },
);

test("starting a second import clears the previous results and prevents double submission", async () => {
  axiosMock.onPost(endpoint).replyOnce(200, {
    count: 0,
    errors: [
      {
        row: 2,
        email: "repeat@example.com",
        message: "Email is repeated in this CSV file.",
      },
    ],
  });
  let finishRequest;
  axiosMock.onPost(endpoint).reply(
    () =>
      new Promise((resolve) => {
        finishRequest = resolve;
      }),
  );
  renderStaff();
  await chooseFile();
  await submitFile();
  expect(await screen.findByText("repeat@example.com")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  await chooseFile();
  await submitFile();
  const pending = await screen.findByRole("button", { name: "Uploading…" });
  expect(pending).toBeDisabled();
  expect(screen.getByLabelText("Upload Staff CSV")).toBeDisabled();
  expect(screen.queryByText("repeat@example.com")).not.toBeInTheDocument();
  await userEvent.click(pending);
  expect(axiosMock.history.post).toHaveLength(2);
  finishRequest([200, { count: 1, errors: [] }]);
  expect(
    await screen.findByText("Staff added: 1. Rows not imported: 0."),
  ).toBeInTheDocument();
});

test("closing and reopening the upload clears an old file error", async () => {
  axiosMock.onPost(endpoint).reply(400, { message: "CSV file is empty" });
  renderStaff();
  await chooseFile();
  await submitFile();
  expect(await screen.findByText("CSV file is empty")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  await chooseFile();
  expect(screen.queryByText("CSV file is empty")).not.toBeInTheDocument();
});
