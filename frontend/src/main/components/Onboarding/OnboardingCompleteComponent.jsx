import { Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router";

export default function OnboardingCompleteComponent({ onReturnHome }) {
  return (
    <>
      <Row>
        <h1>Complete!</h1>
        <p>Congratulations on completing the onboarding process!</p>
      </Row>
      <Row>
        <Col xs="auto" className="text-center">
          {onReturnHome ? (
            <Button onClick={onReturnHome}>Click here to return home</Button>
          ) : (
            <Button as={Link} to="/">
              Click here to return home
            </Button>
          )}
        </Col>
      </Row>
    </>
  );
}
