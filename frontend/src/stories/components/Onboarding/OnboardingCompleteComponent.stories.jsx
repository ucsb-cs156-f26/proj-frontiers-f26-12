import OnboardingCompleteComponent from "main/components/Onboarding/OnboardingCompleteComponent";
import { Container } from "react-bootstrap";
import { fn } from "storybook/test";

export default {
  title: "components/Onboarding/OnboardingCompleteComponent",
  component: OnboardingCompleteComponent,
};

const Template = (args) => (
  <Container>
    <OnboardingCompleteComponent {...args} />
  </Container>
);

export const Default = Template.bind({});

// Preview mode: the return button calls onReturnHome instead of navigating
export const Preview = Template.bind({});
Preview.args = {
  onReturnHome: fn(),
};
