import { currentUserFixtures } from "fixtures/currentUserFixtures";
import RoleBadge from "main/components/Profile/RoleBadge";

export default {
  title: "components/Profile/RoleBadge",
  component: RoleBadge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    role: {
      control: "select",
      options: ["ROLE_USER", "ROLE_MEMBER", "ROLE_INSTRUCTOR", "ROLE_ADMIN"],
      description:
        "A badge appears only when the selected role is in currentUser.root.roles.",
    },
    currentUser: {
      control: false,
    },
  },
  args: {
    role: "ROLE_USER",
    currentUser: currentUserFixtures.userOnly,
  },
};

const Template = (args) => <RoleBadge {...args} />;

export const User = Template.bind({});

export const Member = Template.bind({});
Member.args = {
  role: "ROLE_MEMBER",
  currentUser: currentUserFixtures.instructorUser,
};

export const Instructor = Template.bind({});
Instructor.args = {
  role: "ROLE_INSTRUCTOR",
  currentUser: currentUserFixtures.instructorUser,
};

export const Admin = Template.bind({});
Admin.args = {
  role: "ROLE_ADMIN",
  currentUser: currentUserFixtures.adminUser,
};

export const MissingRole = Template.bind({});
MissingRole.args = {
  role: "ROLE_ADMIN",
};
MissingRole.parameters = {
  docs: {
    description: {
      story:
        "This user has ROLE_USER but not ROLE_ADMIN, so the canvas intentionally shows no badge. Select ROLE_USER in Controls to show the user badge.",
    },
  },
};
