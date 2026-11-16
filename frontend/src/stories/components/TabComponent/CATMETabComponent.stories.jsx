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
      http.post("/api/catme/createteams", () =>
        HttpResponse.json({ message: "Job Launched: 42" }),
      ),
    ],
  },
};

export const TeamUploadAuditDifferences = {
  ...Default,
  parameters: {
    msw: [
      http.post("/api/catme/createteams", () =>
        HttpResponse.json(catmeAuditFixtures.differences),
      ),
    ],
  },
};

export const TeamUploadInvalidFile = {
  ...Default,
  parameters: {
    msw: [
      http.post("/api/catme/createteams", () =>
        HttpResponse.json(
          {
            message:
              "The CATME file has missing or ambiguous team assignments. Export a fresh TeamMaker file with a Team Name column or a Rater Practice section.",
          },
          { status: 422 },
        ),
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
