import { expect, fn, userEvent, within } from "storybook/test";
import TeamsCSVUploadForm from "main/components/Teams/TeamsCSVUploadForm";

// A small synthetic teams CSV, built in the story so that no real roster
// data is imported.
const sampleTeamsCsv = [
  "team,email",
  "team-a,alice@example.edu",
  "team-a,bob@example.edu",
  "team-b,carol@example.edu",
].join("\n");

const sampleTeamsFile = () =>
  new File([sampleTeamsCsv], "sample-teams.csv", { type: "text/csv" });

export default {
  title: "components/Teams/TeamsCSVUploadForm",
  component: TeamsCSVUploadForm,
  argTypes: {
    submitAction: { table: { disable: true } },
  },
  args: {
    submitAction: fn(),
  },
};

const Template = (args) => <TeamsCSVUploadForm {...args} />;

export const Default = Template.bind({});

export const RequiredFileValidation = Template.bind({});
RequiredFileValidation.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByTestId("TeamsCSVUploadForm-submit"));
  await expect(
    await canvas.findByText("Team CSV is required."),
  ).toBeInTheDocument();
  await expect(args.submitAction).not.toHaveBeenCalled();
};

export const SubmitSampleCsv = Template.bind({});
SubmitSampleCsv.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.upload(
    canvas.getByTestId("TeamsCSVUploadForm-upload"),
    sampleTeamsFile(),
  );
  await userEvent.click(canvas.getByTestId("TeamsCSVUploadForm-submit"));
  await expect(args.submitAction).toHaveBeenCalledTimes(1);
  const { upload } = args.submitAction.mock.calls[0][0];
  await expect(upload[0].name).toBe("sample-teams.csv");
};
