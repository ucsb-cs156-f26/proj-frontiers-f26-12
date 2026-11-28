import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import { ProgressBar, Row } from "react-bootstrap";
import OnboardingCompleteComponent from "main/components/Onboarding/OnboardingCompleteComponent";

export default function OnboardingSuccessPage() {
  return (
    <BasicLayout enableBootstrap={true}>
      <OnboardingCompleteComponent />
      <Row className="mt-auto pb-3">
        <ProgressBar now={100} />
      </Row>
    </BasicLayout>
  );
}
