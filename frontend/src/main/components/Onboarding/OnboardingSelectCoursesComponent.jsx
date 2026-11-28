import { Row, Button, Col } from "react-bootstrap";
import { Link } from "react-router";
import {
  StudentCoursesTable,
  StudentCoursesTableView,
} from "main/components/Courses/StudentCoursesTable";

// Stryker disable all : no-op defaults used only when a preview omits a handler
const notJoining = () => false;
const noop = () => {};
// Stryker restore all

export default function OnboardingSelectCoursesComponent({
  courses,
  onJoinCourse = noop,
  onViewInvite = noop,
  onContinue,
}) {
  return (
    <>
      <Row>
        <h1>Joining Courses</h1>
        <p>
          Next, you&#39;re listed on the roster of the courses below. Follow the
          prompts to join:
        </p>
        {courses ? (
          // Preview mode: no course name links and no real GitHub invite, so
          // every control stays inside the preview
          <StudentCoursesTableView
            courses={courses}
            testid={"OnboardingCoursesTable"}
            joinCallback={onJoinCourse}
            isLoading={notJoining}
            viewInviteCallback={onViewInvite}
          />
        ) : (
          <StudentCoursesTable testid={"OnboardingCoursesTable"} />
        )}
      </Row>
      <Row className="pt-5 justify-content-center pb-3">
        <Col xs="auto" className="text-center">
          {onContinue ? (
            <Button onClick={onContinue}>Continue</Button>
          ) : (
            <Button as={Link} to="/onboarding/success">
              Continue
            </Button>
          )}
        </Col>
      </Row>
    </>
  );
}
