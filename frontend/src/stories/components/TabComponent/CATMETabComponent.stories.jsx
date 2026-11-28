import CATMETabComponent from "main/components/TabComponent/CATMETabComponent";
import { catmeAuditFixtures } from "fixtures/catmeAuditFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "components/TabComponent/CATMETabComponent",
  component: CATMETabComponent,
};

export const Default = {
  args: { courseId: 7, testIdPrefix: "InstructorCourseShowPage" },
  parameters: {
    msw: [
      http.post("/api/catme/audit", () =>
        HttpResponse.json(catmeAuditFixtures.differences),
      ),
    ],
  },
};

export const NoDifferences = {
  ...Default,
  parameters: {
    msw: [
      http.post("/api/catme/audit", () =>
        HttpResponse.json(catmeAuditFixtures.clean),
      ),
    ],
  },
};

export const InvalidFile = {
  ...Default,
  parameters: {
    msw: [
      http.post("/api/catme/audit", () =>
        HttpResponse.json(
          {
            message:
              "The uploaded file was not in a recognized CATME TeamMaker CSV format.",
          },
          { status: 422 },
        ),
      ),
    ],
  },
};
