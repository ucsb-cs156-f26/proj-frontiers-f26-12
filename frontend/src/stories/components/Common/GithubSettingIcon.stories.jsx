import GithubSettingIcon from "main/components/Common/GithubSettingIcon";

export default {
  title: "components/Common/GithubSettingIcon",
  component: GithubSettingIcon,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "3rem" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: { control: { type: "number", min: 8, max: 128, step: 1 } },
    gearColor: { control: "color" },
    githubColor: { control: "color" },
  },
  args: {
    size: 24,
    gearColor: "blue",
    githubColor: "black",
  },
};

const Template = (args) => <GithubSettingIcon {...args} />;

export const Default = Template.bind({});

export const Small = Template.bind({});
Small.args = { size: 16 };

export const Large = Template.bind({});
Large.args = { size: 64 };

export const CustomColors = Template.bind({});
CustomColors.args = {
  size: 48,
  gearColor: "#dc3545",
  githubColor: "#6f42c1",
};
