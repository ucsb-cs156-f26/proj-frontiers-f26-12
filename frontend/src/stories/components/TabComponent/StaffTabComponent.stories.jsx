import StaffTabComponent from "main/components/TabComponent/StaffTabComponent";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import { http, HttpResponse } from "msw";
import { expect, userEvent, within } from "storybook/test";

const existingStaff = {
  id: 1,
  firstName: "Casey",
  lastName: "Reviewer",
  email: "staff.review@example.com",
  orgStatus: "PENDING",
};
let staff;

export default {
  title: "components/TabComponent/StaffTabComponent",
  component: StaffTabComponent,
  args: {
    courseId: 7,
    testIdPrefix: "StaffTab",
    currentUser: currentUserFixtures.instructorUser,
  },
  loaders: [
    () => {
      staff = [existingStaff];
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("/api/coursestaff/course", () => HttpResponse.json(staff)),
        http.get("/api/courses/emails", () =>
          HttpResponse.text(staff.map((member) => member.email).join(",")),
        ),
        http.post("/api/coursestaff/post", ({ request }) => {
          const params = new URL(request.url).searchParams;
          const email = params.get("email").trim();
          if (staff.some((member) => member.email === email)) {
            return HttpResponse.json(
              {
                message: `${email} is already on this course's staff. Enter a different email address to add another staff member.`,
              },
              { status: 409 },
            );
          }
          const added = {
            id: staff.length + 1,
            firstName: params.get("firstName"),
            lastName: params.get("lastName"),
            email,
            orgStatus: "PENDING",
          };
          staff = [...staff, added];
          return HttpResponse.json(added);
        }),
      ],
    },
  },
};

export const DuplicateEmail = {
  play: async ({ canvasElement }) => {
    // The modal is rendered in a portal outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      page.getByRole("button", { name: "Add Staff Member" }),
    );
    await userEvent.type(page.getByLabelText("First Name"), "Casey");
    await userEvent.type(page.getByLabelText("Last Name"), "Reviewer");
    await userEvent.type(page.getByLabelText("Email"), existingStaff.email);
    await userEvent.click(page.getByRole("button", { name: "Create" }));
    await expect(page.findByRole("alert")).resolves.toHaveTextContent(
      "staff.review@example.com is already on this course's staff.",
    );
  },
};
