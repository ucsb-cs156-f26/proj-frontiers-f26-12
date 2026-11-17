import AppNavbarLocalhost from "main/components/Nav/AppNavbarLocalhost";

export default {
  title: "components/Nav/AppNavbarLocalhost",
  component: AppNavbarLocalhost,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    url: {
      control: "text",
      description: "Current frontend development server URL",
    },
  },
};

const Template = (args) => <AppNavbarLocalhost {...args} />;

export const Default = Template.bind({});
Default.args = {
  url: "http://localhost:3000",
};

export const AlternativePort = Template.bind({});
AlternativePort.args = {
  url: "http://localhost:5173",
};

export const IpAddress = Template.bind({});
IpAddress.args = {
  url: "http://127.0.0.1:3000",
};

export const EmptyUrl = Template.bind({});
EmptyUrl.args = {
  url: "",
};
