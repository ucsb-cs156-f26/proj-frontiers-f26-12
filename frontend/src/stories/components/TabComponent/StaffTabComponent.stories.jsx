import StaffTabComponent from "main/components/TabComponent/StaffTabComponent";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import { courseStaffFixtures } from "fixtures/courseStaffFixtures";
import coursesFixtures from "fixtures/coursesFixtures";
import { http, HttpResponse } from "msw";
import { toast } from "react-toastify";

const course = { ...coursesFixtures.oneCourseWithEachStatus[0], id: 7 };
const staff = courseStaffFixtures.threeStaff.map((member, index) => ({
  ...member,
  course,
  githubLogin: ["johnprof", "janeinstr", null][index],
  orgStatus: ["OWNER", "MEMBER", "INVITED"][index],
}));
const importedStaff = {
  id: 90,
  course,
  firstName: "Casey",
  lastName: "Gaucho",
  email: "caseygaucho@ucsb.edu",
  githubLogin: null,
  orgStatus: "JOINCOURSE",
};

export default {
  title: "components/TabComponent/StaffTabComponent",
  component: StaffTabComponent,
  args: {
    courseId: course.id,
    testIdPrefix: "StaffTabComponent",
    currentUser: currentUserFixtures.instructorUser,
    isInstructor: true,
  },
  argTypes: {
    courseId: { control: false },
    currentUser: { control: false },
    testIdPrefix: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Standalone staff roster with instructor and non-instructor views. Search Mark, janeinstr, or an email; inspect status tooltips and switch the Emails format. Add, edit, and delete update the local roster and email list. Uploading any CSV adds the deterministic Casey Gaucho example (the file is not parsed). CSV help displays a preview toast. Reopening a story resets its data.",
      },
    },
  },
};

function staffStory(initialStaff, args = {}) {
  let members = structuredClone(initialStaff);
  let nextId = 100;

  return {
    args,
    beforeEach: () => {
      members = structuredClone(initialStaff);
      nextId = 100;
      const originalOpen = window.open;
      window.open = (url) => {
        toast(`Storybook preview: would open ${url}`);
        return null;
      };
      return () => {
        window.open = originalOpen;
      };
    },
    parameters: {
      msw: {
        handlers: [
          http.get("/api/coursestaff/course", () => HttpResponse.json(members)),
          http.get("/api/courses/emails", ({ request }) => {
            const format = new URL(request.url).searchParams.get("format");
            return HttpResponse.text(
              members
                .map((member) => member.email)
                .join(format === "COMMA_SEPARATED" ? "," : "\r\n"),
            );
          }),
          http.post("/api/coursestaff/post", ({ request }) => {
            const member = {
              ...importedStaff,
              ...Object.fromEntries(new URL(request.url).searchParams),
              id: nextId++,
            };
            members = [...members, member];
            return HttpResponse.json(member);
          }),
          http.post("/api/coursestaff/upload/csv", () => {
            const created = members.some(
              (member) => member.id === importedStaff.id,
            )
              ? 0
              : 1;
            if (created) members = [...members, structuredClone(importedStaff)];
            return HttpResponse.json({ created, updated: 0, rejected: [] });
          }),
          http.put("/api/coursestaff", ({ request }) => {
            const params = new URL(request.url).searchParams;
            members = members.map((member) =>
              member.id === Number(params.get("id"))
                ? { ...member, ...Object.fromEntries(params), id: member.id }
                : member,
            );
            return HttpResponse.json({});
          }),
          http.delete("/api/coursestaff/delete", ({ request }) => {
            const id = Number(new URL(request.url).searchParams.get("id"));
            members = members.filter((member) => member.id !== id);
            return HttpResponse.json({});
          }),
        ],
      },
    },
  };
}

export const InstructorStaff = staffStory(staff);

export const EmptyStaff = staffStory([]);

export const NonInstructor = staffStory(staff, {
  currentUser: currentUserFixtures.userOnly,
  isInstructor: false,
});
