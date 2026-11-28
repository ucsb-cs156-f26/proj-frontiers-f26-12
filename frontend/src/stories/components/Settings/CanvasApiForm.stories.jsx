import { http, HttpResponse } from "msw";
import { fn } from "storybook/test";
import CanvasApiForm from "main/components/Settings/CanvasApiForm";

export default {
  title: "components/Settings/CanvasApiForm",
  component: CanvasApiForm,
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
        http.get("/api/courses/getCanvasInfo", () =>
          HttpResponse.json({ canvasApiToken: "", canvasCourseId: "" }),
        ),
      ],
    },
  },
};

export const Configured = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/courses/getCanvasInfo", () =>
          HttpResponse.json({
            canvasApiToken: "********storybook-demo",
            canvasCourseId: "1234567",
          }),
        ),
      ],
    },
  },
};
