import { useState } from "react";
import { Link, useParams } from "react-router";
import { Alert, Button, ButtonGroup, ProgressBar, Row } from "react-bootstrap";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import { useBackend } from "main/utils/useBackend";
import { hasRole, useCurrentUser } from "main/utils/currentUser";
import OnboardingSelectSchoolComponent from "main/components/Onboarding/OnboardingSelectSchoolComponent";
import OnboardingGithubSignInComponent from "main/components/Onboarding/OnboardingGithubSignInComponent";
import OnboardingSelectCoursesComponent from "main/components/Onboarding/OnboardingSelectCoursesComponent";
import OnboardingCompleteComponent from "main/components/Onboarding/OnboardingCompleteComponent";

const previewStages = [
  { key: "school", label: "School sign in", progress: 25 },
  { key: "github", label: "GitHub sign in", progress: 50 },
  { key: "courses", label: "Join courses", progress: 75 },
  { key: "complete", label: "Complete", progress: 100 },
];

// Stryker disable next-line all : the read-only preview ignores these actions on purpose
const doNothing = () => {};

export default function OnboardingPreviewPage() {
  const currentUser = useCurrentUser();
  const { courseId } = useParams();
  const [stage, setStage] = useState("school");

  // The backend only returns a course to admins, its instructor and its staff,
  // so a failed request means this viewer may not see the preview.
  const { data: course, failureCount } = useBackend(
    // Stryker disable next-line all : the query key only affects caching
    [`/api/courses/${courseId}`],
    // Stryker disable next-line StringLiteral : GET and empty string are equivalent
    { method: "GET", url: `/api/courses/${courseId}` },
    null,
    true,
  );

  if (failureCount > 0) {
    return (
      <BasicLayout>
        <h2 data-testid="OnboardingPreviewPage-denied">
          You do not have access to preview onboarding for this course.
        </h2>
        <Button as={Link} to="/">
          Return
        </Button>
      </BasicLayout>
    );
  }

  if (!course) {
    return (
      <BasicLayout>
        <p data-testid="OnboardingPreviewPage-loading">Loading...</p>
      </BasicLayout>
    );
  }

  // Stryker disable OptionalChaining : currentUser.root is null until the user loads
  const canSeeInstructorView =
    hasRole(currentUser, "ROLE_ADMIN") ||
    currentUser?.root?.user?.email === course.instructorEmail;
  // Stryker restore OptionalChaining
  const returnPath = `/${canSeeInstructorView ? "instructor" : "staff"}/courses/${courseId}`;

  // A single sample row based on this course, so the screenshot looks like
  // what students of this course will actually see.
  const sampleCourses = [
    {
      id: course.id,
      rosterStudentId: 0,
      courseName: course.courseName,
      term: course.term,
      school: course.school,
      orgName: course.orgName,
      studentStatus: "JOINCOURSE",
    },
  ];

  const renderStage = () => {
    switch (stage) {
      case "github":
        return <OnboardingGithubSignInComponent onSignIn={doNothing} />;
      case "courses":
        return (
          <OnboardingSelectCoursesComponent
            courses={sampleCourses}
            onContinue={doNothing}
          />
        );
      case "complete":
        return <OnboardingCompleteComponent onReturnHome={doNothing} />;
      default:
        return <OnboardingSelectSchoolComponent onSignIn={doNothing} />;
    }
  };

  const currentStage = previewStages.find(
    (stageInfo) => stageInfo.key === stage,
  );

  return (
    <BasicLayout enableBootstrap={true}>
      <Alert variant="info" data-testid="OnboardingPreviewPage-banner">
        <strong>Student onboarding preview</strong> for {course.courseName} (
        {course.term}). This shows what students see. Nothing here signs anyone
        in, joins a course, or changes any account.
      </Alert>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <ButtonGroup aria-label="Onboarding stage">
          {previewStages.map((stageInfo) => (
            <Button
              key={stageInfo.key}
              variant={stageInfo.key === stage ? "primary" : "outline-primary"}
              onClick={() => setStage(stageInfo.key)}
              data-testid={`OnboardingPreviewPage-stage-${stageInfo.key}`}
            >
              {stageInfo.label}
            </Button>
          ))}
        </ButtonGroup>
        <Button
          as={Link}
          to={returnPath}
          variant="secondary"
          className="ms-auto"
          data-testid="OnboardingPreviewPage-return"
        >
          Return to course
        </Button>
      </div>
      {renderStage()}
      <Row className="mt-auto pb-3">
        <ProgressBar now={currentStage.progress} />
      </Row>
    </BasicLayout>
  );
}
