import { MemoryRouter, useLocation } from "react-router";
import { expect, fn, userEvent, within } from "storybook/test";
import TeamMemberForm from "main/components/Teams/TeamMemberForm";
import { rosterStudentFixtures } from "fixtures/rosterStudentFixtures";

export default {
  title: "components/Teams/TeamMemberForm",
  component: TeamMemberForm,
  argTypes: {
    rosterStudents: {
      control: "object",
      description: "The roster students offered in the dropdown.",
    },
    initialContents: {
      control: "object",
      description: "Values to prefill, e.g. { rosterStudentId: 4 }.",
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
    rosterStudents: rosterStudentFixtures.threeStudents,
    buttonLabel: "Add Member",
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
    <p className="mt-3 mb-0 text-muted" data-testid="TeamMemberForm-story-path">
      Current path: {location.pathname}
      {location.search}
    </p>
  );
};

// Cancel calls navigate(-1). The router starts with a previous page in its
// history so that Cancel goes back to it and stays inside the story.
const Template = ({
  initialContents,
  rosterStudents,
  submitAction,
  buttonLabel,
  cancelDisabled,
}) => (
  <MemoryRouter
    initialEntries={[
      "/instructor/courses/7?tab=teams",
      "/story/team-member-form",
    ]}
    initialIndex={1}
  >
    <div style={{ maxWidth: "32rem" }}>
      <TeamMemberForm
        initialContents={initialContents}
        rosterStudents={rosterStudents}
        submitAction={submitAction}
        buttonLabel={buttonLabel}
        cancelDisabled={cancelDisabled}
      />
      <CurrentPath />
    </div>
  </MemoryRouter>
);

export const SelectStudent = Template.bind({});

export const PrefilledStudent = Template.bind({});
PrefilledStudent.args = {
  initialContents: {
    rosterStudentId: rosterStudentFixtures.threeStudents[1].id,
  },
};

export const CancelDisabled = Template.bind({});
CancelDisabled.args = {
  cancelDisabled: true,
};

export const SelectionRequired = Template.bind({});
SelectionRequired.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByTestId("TeamMemberForm-submit"));
  await expect(canvas.getByTestId("RosterStudentDropdown")).toHaveClass(
    "is-invalid",
  );
  await expect(args.submitAction).not.toHaveBeenCalled();
};

export const SubmitSelectedStudent = Template.bind({});
SubmitSelectedStudent.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByTestId("RosterStudentDropdown"), "Emma");
  await userEvent.click(
    await canvas.findByRole("option", { name: /Emma Watson/ }),
  );
  await userEvent.click(canvas.getByTestId("TeamMemberForm-submit"));
  await expect(args.submitAction).toHaveBeenCalledTimes(1);
  await expect(args.submitAction.mock.calls[0][0]).toEqual({
    rosterStudentId: rosterStudentFixtures.threeStudents[2].id,
  });
};
