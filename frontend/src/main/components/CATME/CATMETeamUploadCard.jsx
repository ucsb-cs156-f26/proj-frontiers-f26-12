import { Alert, Card } from "react-bootstrap";
import CATMEAuditResults from "main/components/CATME/CATMEAuditResults";
import CATMEUploadForm from "main/components/CATME/CATMEUploadForm";

const uploadConfig = {
  endpoint: "createteams",
  formLabel: "Upload CATME teams",
  fileLabel: "CATME team assignments CSV file",
  buttonLabel: "Upload teams",
  pendingLabel: "Uploading teams…",
  missingFileMessage: "Choose a CATME TeamMaker CSV file to upload teams.",
  errorMessage: "Unable to upload teams. Please try again.",
};

export default function CATMETeamUploadCard({ courseId }) {
  return (
    <Card as="section" aria-label="CATME team upload" className="mt-4">
      <Card.Header as="h2" className="h5">
        Upload Teams from CATME
      </Card.Header>
      <Card.Body>
        <p>Upload team assignments from CATME TeamMaker to this course.</p>
        <ol>
          <li>
            In CATME, navigate to <code>/faculty/tm_display_results</code> and
            click <strong>Export to CSV</strong>.
          </li>
          <li>Upload that file here.</li>
          <li>
            Read the audit results. If the roster matches, a job creates the
            teams automatically; otherwise, correct the differences in CATME and
            upload a fresh export.
          </li>
        </ol>
        <p>
          Creates or reuses teams in Frontiers and preserves existing
          memberships. Students without a team name are skipped. To also create
          the teams in GitHub, use Push Teams to GitHub on the Teams tab.
        </p>
        <CATMEUploadForm courseId={courseId} config={uploadConfig}>
          {(result) =>
            result.message ? (
              <Alert variant="success" role="status" className="mt-3">
                <p>
                  {result.message}. Team creation is running in the background.
                </p>
                <a href={`/instructor/courses/${courseId}?tab=jobs`}>
                  View progress in the Jobs tab
                </a>
              </Alert>
            ) : (
              <>
                <p className="mt-3">No team-creation job was launched.</p>
                <CATMEAuditResults result={result} />
              </>
            )
          }
        </CATMEUploadForm>
      </Card.Body>
    </Card>
  );
}
