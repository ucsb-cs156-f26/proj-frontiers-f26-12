import { expect, fn, userEvent, within } from "storybook/test";
import DokkuUsersListHeaderForm from "main/components/Dokku/DokkuUsersListHeaderForm";

export default {
  title: "components/Dokku/DokkuUsersListHeaderForm",
  component: DokkuUsersListHeaderForm,
  argTypes: {
    initialContents: {
      control: "text",
      description:
        "The current header: lines placed at the start of dokku_users_list.csv.",
    },
    buttonLabel: {
      control: "text",
      description: "The label of the submit button.",
    },
    submitAction: { table: { disable: true } },
  },
  args: {
    initialContents: "",
    buttonLabel: "Save Header",
    submitAction: fn(),
  },
};

const Template = (args) => (
  <div style={{ maxWidth: "40rem" }}>
    <DokkuUsersListHeaderForm {...args} />
  </div>
);

export const Empty = Template.bind({});

export const Prefilled = Template.bind({});
Prefilled.args = {
  initialContents: "eci-staff,dokku-00\nguest-project,dokku-01",
};

export const SubmitEditedHeader = Template.bind({});
SubmitEditedHeader.args = {
  initialContents: "eci-staff,dokku-00",
};
SubmitEditedHeader.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  const header = canvas.getByTestId(
    "DokkuUsersListHeaderForm-dokkuUsersListHeader",
  );
  await userEvent.type(header, "{enter}guest-project,dokku-01");
  await userEvent.click(canvas.getByTestId("DokkuUsersListHeaderForm-submit"));
  await expect(args.submitAction).toHaveBeenCalledTimes(1);
  await expect(args.submitAction.mock.calls[0][0]).toEqual({
    dokkuUsersListHeader: "eci-staff,dokku-00\nguest-project,dokku-01",
  });
};
