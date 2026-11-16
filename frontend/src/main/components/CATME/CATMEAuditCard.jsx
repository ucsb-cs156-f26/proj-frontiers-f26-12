import { Card } from "react-bootstrap";
import CATMEAuditResults from "main/components/CATME/CATMEAuditResults";
import CATMEUploadForm from "main/components/CATME/CATMEUploadForm";

const uploadConfig = {
  endpoint: "audit",
  formLabel: "Audit CATME CSV",
  fileLabel: "CATME TeamMaker CSV file",
  buttonLabel: "Audit CSV",
  pendingLabel: "Auditing…",
  missingFileMessage: "Choose a CATME TeamMaker CSV file to audit.",
  errorMessage: "Unable to audit this file. Please try again.",
};

export default function CATMEAuditCard({ courseId }) {
  return (
    <Card as="section" aria-label="CATME roster audit" className="mt-4">
      <Card.Header as="h2" className="h5">
        Audit CATME Teammaker CSV Download
      </Card.Header>
      <Card.Body>
        <p>
          Compare the CATME roster with this course&apos;s Frontiers roster.
          Frontiers is the source of truth: the results show students to add to
          CATME, remove from CATME, or update (name or section).
        </p>
        <ol>
          <li>
            In CATME, navigate to <code>/faculty/tm_display_results</code> and
            click <strong>Export to CSV</strong>.
          </li>
          <li>Upload that file here.</li>
          <li>Read the results.</li>
        </ol>
        <p>This audit does not change either roster or create teams.</p>

        <CATMEUploadForm courseId={courseId} config={uploadConfig}>
          {(result) => <CATMEAuditResults result={result} />}
        </CATMEUploadForm>
      </Card.Body>
    </Card>
  );
}
