import { http, HttpResponse } from "msw";
import { fn } from "storybook/test";
import SlackTokenForm from "main/components/Settings/SlackTokenForm";

export default {
  title: "components/Settings/SlackTokenForm",
  component: SlackTokenForm,
  args: {
    courseId: 1,
    submitAction: fn().mockName("submitAction"),
  },
  argTypes: {
    courseId: { control: false },
    submitAction: { control: false },
  },
};

export const Unconfigured = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/courses/slack/info", () =>
          HttpResponse.json({
            courseId: "1",
            slackBotToken: "",
            slackTeamId: "",
            slackTeamName: "",
          }),
        ),
      ],
    },
  },
};

export const Configured = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/courses/slack/info", () =>
          HttpResponse.json({
            courseId: "1",
            slackBotToken: "xoxb-********-demo",
            slackTeamId: "TDEMO1234",
            slackTeamName: "Storybook Demo Workspace",
          }),
        ),
      ],
    },
  },
};

export const VerificationError = {
  args: {
    errorMessage:
      "Slack rejected this token as invalid. Copy the Bot User OAuth Token (xoxb-...) from your Slack app's OAuth & Permissions page and try again. The token was not saved.",
  },
  parameters: Unconfigured.parameters,
};
