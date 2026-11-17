import { Fragment, useState } from "react";
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

// Stryker disable next-line all : returning home is ignored on purpose so the preview stays open
const doNothing = () => {};

export default function OnboardingPreviewPage() {
  const currentUser = useCurrentUser();
  const { courseId } = useParams();
  const [stage, setStage] = useState("school");
  const [joined, setJoined] = useState(false);
  const [inviteViewed, setInviteViewed] = useState(false);
  const [resetCount, setResetCount] = useState(0);

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

  // One sample row based on this course. Joining it only flips the in-memory
  // joined flag, which is the same JOINCOURSE to INVITED change a real student
  // sees after joining. Nothing is sent to the backend.
  const sampleCourses = [
    {
      id: course.id,
      rosterStudentId: 0,
      courseName: course.courseName,
      term: course.term,
      school: course.school,
      orgName: course.orgName,
      studentStatus: joined ? "INVITED" : "JOINCOURSE",
    },
  ];

  const resetPreview = () => {
    setStage("school");
    setJoined(false);
    setInviteViewed(false);
    // Stryker disable next-line all : any new key remounts the screens, which clears the school picker
    setResetCount((count) => count + 1);
  };

  const renderStage = () => {
    switch (stage) {
      case "github":
        return (
          <OnboardingGithubSignInComponent
            onSignIn={() => setStage("courses")}
          />
        );
      case "courses":
        return (
          <>
            {inviteViewed && (
              <Alert
                variant="secondary"
                data-testid="OnboardingPreviewPage-invite-notice"
              >
                In the real flow, View Invite opens the GitHub invitation for
                the {course.orgName} organization in a new tab. The preview does
                not open it, since no invitation was sent.
              </Alert>
            )}
            <OnboardingSelectCoursesComponent
              courses={sampleCourses}
              onJoinCourse={() => setJoined(true)}
              onViewInvite={() => setInviteViewed(true)}
              onContinue={() => setStage("complete")}
            />
          </>
        );
      case "complete":
        return <OnboardingCompleteComponent onReturnHome={doNothing} />;
      default:
        return (
          <OnboardingSelectSchoolComponent
            onSignIn={() => setStage("github")}
          />
        );
    }
  };

  const currentStage = previewStages.find(
    (stageInfo) => stageInfo.key === stage,
  );

  return (
    <BasicLayout enableBootstrap={true}>
      <Alert variant="info" data-testid="OnboardingPreviewPage-banner">
        <strong>Student onboarding preview</strong> for {course.courseName} (
        {course.term}). Click through it like a student would, or jump to a
        stage with the buttons below. Nothing here signs anyone in, joins a
        course, or changes any account.
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
          variant="outline-secondary"
          onClick={resetPreview}
          data-testid="OnboardingPreviewPage-reset"
        >
          Reset preview
        </Button>
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
      <Fragment key={resetCount}>{renderStage()}</Fragment>
      <Row className="mt-auto pb-3">
        <ProgressBar now={currentStage.progress} />
      </Row>
    </BasicLayout>
  );
}
