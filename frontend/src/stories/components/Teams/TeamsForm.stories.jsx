import { MemoryRouter, useLocation } from "react-router";
import { expect, fn, userEvent, within } from "storybook/test";
import TeamsForm from "main/components/Teams/TeamsForm";
import { teamsFixtures } from "fixtures/TeamsFixtures";

export default {
  title: "components/Teams/TeamsForm",
  component: TeamsForm,
  argTypes: {
    initialContents: {
      control: "object",
      description: "Values to prefill: name and isStaffTeam.",
    },
    buttonLabel: {
      control: "text",
      description: "The label of the submit button.",
    },
    cancelDisabled: {
      control: "boolean",
      description: "Whether to hide the Cancel button.",
    },
    submitAction: { table: { disable: true } },
    suppressMemoryRouter: { table: { disable: true } },
  },
  args: {
    buttonLabel: "Create",
    cancelDisabled: false,
    submitAction: fn(),
    // This story supplies its own router (below), so the global MemoryRouter
    // decorator is turned off.
    suppressMemoryRouter: true,
  },
};

const CurrentPath = () => {
  const location = useLocation();
  return (
    <p className="mt-3 mb-0 text-muted" data-testid="TeamsForm-story-path">
      Current path: {location.pathname}
      {location.search}
    </p>
  );
};

// Cancel calls navigate(-1). The router starts with a previous page in its
// history so that Cancel goes back to it and stays inside the story.
const Template = ({
  initialContents,
  submitAction,
  buttonLabel,
  cancelDisabled,
}) => (
  <MemoryRouter
    initialEntries={["/instructor/courses/7?tab=teams", "/story/teams-form"]}
    initialIndex={1}
  >
    <div style={{ maxWidth: "32rem" }}>
      <TeamsForm
        initialContents={initialContents}
        submitAction={submitAction}
        buttonLabel={buttonLabel}
        cancelDisabled={cancelDisabled}
      />
      <CurrentPath />
    </div>
  </MemoryRouter>
);

export const Create = Template.bind({});

export const Edit = Template.bind({});
Edit.args = {
  initialContents: {
    name: teamsFixtures.teams[0].name,
    isStaffTeam: false,
  },
  buttonLabel: "Update",
};

export const EditStaffTeam = Template.bind({});
EditStaffTeam.args = {
  initialContents: {
    name: teamsFixtures.staffTeam.name,
    isStaffTeam: teamsFixtures.staffTeam.isStaffTeam,
  },
  buttonLabel: "Update",
};

export const CancelDisabled = Template.bind({});
CancelDisabled.args = {
  cancelDisabled: true,
};

export const NameRequired = Template.bind({});
NameRequired.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByTestId("TeamsForm-submit"));
  await expect(
    await canvas.findByText("Team Name is required."),
  ).toBeInTheDocument();
  await expect(args.submitAction).not.toHaveBeenCalled();
};

export const SubmitStaffTeam = Template.bind({});
SubmitStaffTeam.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByTestId("TeamsForm-name"), "team-c");
  await userEvent.click(canvas.getByTestId("TeamsForm-isStaffTeam"));
  await userEvent.click(canvas.getByTestId("TeamsForm-submit"));
  await expect(args.submitAction).toHaveBeenCalledTimes(1);
  await expect(args.submitAction.mock.calls[0][0]).toEqual({
    name: "team-c",
    isStaffTeam: true,
  });
};
