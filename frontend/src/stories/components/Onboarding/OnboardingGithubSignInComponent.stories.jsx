import OnboardingGithubSignInComponent from "main/components/Onboarding/OnboardingGithubSignInComponent";
import { Container } from "react-bootstrap";
import { fn } from "storybook/test";

export default {
  title: "components/Onboarding/OnboardingGithubSignInComponent",
  component: OnboardingGithubSignInComponent,
};

const Template = (args) => (
  <Container>
    <OnboardingGithubSignInComponent {...args} />
  </Container>
);

export const Default = Template.bind({});

// Preview mode: Log In calls onSignIn instead of starting GitHub OAuth
export const Preview = Template.bind({});
Preview.args = {
  onSignIn: fn(),
};
