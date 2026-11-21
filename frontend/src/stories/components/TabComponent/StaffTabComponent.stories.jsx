import StaffTabComponent from "main/components/TabComponent/StaffTabComponent";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import { courseStaffFixtures } from "fixtures/courseStaffFixtures";
import { http, HttpResponse } from "msw";
import { MixedResults } from "../CourseStaff/CourseStaffCSVUploadResult.stories";

export default {
  title: "components/TabComponent/StaffTabComponent",
  component: StaffTabComponent,
  args: {
    courseId: 7,
    testIdPrefix: "StaffTabComponent",
    currentUser: currentUserFixtures.instructorUser,
  },
};

const handlers = (result, status = 200) => [
  http.get("/api/coursestaff/course", () =>
    HttpResponse.json(courseStaffFixtures.threeStaff),
  ),
  http.get("/api/courses/emails", () => HttpResponse.text("staff@example.com")),
  http.post("/api/coursestaff/upload/csv", () =>
    HttpResponse.json(result, { status }),
  ),
];

export const CsvMixedResults = {
  parameters: { msw: handlers(MixedResults.args.result) },
};

export const CsvAllValid = {
  parameters: { msw: handlers({ count: 2, errors: [] }) },
};

export const CsvAllRejected = {
  parameters: { msw: handlers({ ...MixedResults.args.result, count: 0 }) },
};

export const CsvInvalidFile = {
  parameters: {
    msw: handlers(
      {
        message:
          "CSV headers do not match expected format. Expected: firstName,lastName,email",
      },
      400,
    ),
  },
};
