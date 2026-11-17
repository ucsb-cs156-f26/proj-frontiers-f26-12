import { http, HttpResponse } from "msw";
import SettingsTabComponent from "main/components/TabComponent/SettingsTabComponent";

export default {
  title: "components/TabComponent/SettingsTabComponent",
  component: SettingsTabComponent,
  args: {
    courseId: 1,
    testIdPrefix: "Settings",
    canEditCourseOptions: true,
  },
  argTypes: {
    courseId: { control: false },
    testIdPrefix: { control: false },
  },
};

function settingsStory({
  configured = false,
  enabled = true,
  canEdit = true,
} = {}) {
  let options;
  let canvasInfo;
  let slackInfo;

  const reset = () => {
    options = {
      ENABLE_CANVAS: enabled,
      TRANSLATE_SECTIONS: true,
      DOKKU_MANAGER: false,
      ENABLE_API_KEYS: false,
      SLACK_INTEGRATION: enabled,
      NEW_ASSIGNMENT_FEATURES: false,
      ENABLE_EDUDORA: false,
      ENABLE_CATME: false,
    };
    canvasInfo = {
      canvasApiToken: configured ? "********storybook-demo" : "",
      canvasCourseId: configured ? "1234567" : "",
    };
    slackInfo = {
      courseId: "1",
      slackBotToken: configured ? "xoxb-********-demo" : "",
      slackTeamId: configured ? "TDEMO1234" : "",
      slackTeamName: configured ? "Storybook Demo Workspace" : "",
    };
  };

  reset();

  return {
    args: { canEditCourseOptions: canEdit },
    // Reset mock data whenever the story is entered, including after edits.
    beforeEach: reset,
    parameters: {
      msw: {
        handlers: [
          http.get("/api/course/options", () => HttpResponse.json(options)),
          http.post("/api/course/options", ({ request }) => {
            const params = new URL(request.url).searchParams;
            const option = params.get("option");
            const enabled = params.get("enabled") === "true";
            options = { ...options, [option]: enabled };
            return HttpResponse.json({ [option]: enabled });
          }),
          http.get("/api/courses/getCanvasInfo", () =>
            HttpResponse.json(canvasInfo),
          ),
          http.put("/api/courses/updateCourseCanvasToken", ({ request }) => {
            const params = new URL(request.url).searchParams;
            if (params.get("canvasApiToken")) {
              canvasInfo.canvasApiToken = "********storybook-updated";
            }
            if (params.get("canvasCourseId")) {
              canvasInfo.canvasCourseId = params.get("canvasCourseId");
            }
            return HttpResponse.json(canvasInfo);
          }),
          http.get("/api/courses/slack/info", () =>
            HttpResponse.json(slackInfo),
          ),
          http.post("/api/courses/slack/token", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            if (params.get("slackBotToken") === "xoxb-storybook-invalid") {
              return HttpResponse.json(
                {
                  message:
                    "Slack rejected this demo token. The token was not saved.",
                },
                { status: 400 },
              );
            }
            slackInfo = {
              courseId: "1",
              slackBotToken: "xoxb-********-updated",
              slackTeamId: "TDEMO1234",
              slackTeamName: "Storybook Demo Workspace",
            };
            return HttpResponse.json(slackInfo);
          }),
        ],
      },
    },
  };
}

export const Unconfigured = settingsStory();

export const Configured = settingsStory({ configured: true });

export const IntegrationsDisabled = settingsStory({ enabled: false });

export const ReadOnlyOptions = settingsStory({
  configured: true,
  canEdit: false,
});
