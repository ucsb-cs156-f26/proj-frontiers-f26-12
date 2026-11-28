import { useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useBackendMutation } from "main/utils/useBackend";
import CATMEAuditResults from "main/components/CATME/CATMEAuditResults";

export default function CATMEAuditCard({ courseId }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const mutation = useBackendMutation(
    (selectedFile) => {
      const data = new FormData();
      data.append("file", selectedFile);
      return {
        method: "POST",
        url: "/api/catme/audit",
        params: { courseId },
        data,
      };
    },
    {
      onSuccess: setResult,
      onError: (failure) =>
        setError(
          failure.response?.data?.message ??
            "Unable to audit this file. Please try again.",
        ),
    },
  );

  const submit = (event) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setResult(null);
    if (!file) {
      setError("Choose a CATME TeamMaker CSV file to audit.");
      return;
    }
    setError(null);
    mutation.mutate(file);
  };

  const chooseFile = (event) => {
    setFile(event.target.files[0] ?? null);
    setError(null);
    setResult(null);
  };

  return (
    <Card className="mt-4">
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

        <Form onSubmit={submit} noValidate aria-label="Audit CATME CSV">
          <Form.Group
            className="mb-3"
            controlId={`catme-audit-file-${courseId}`}
          >
            <Form.Label>CATME TeamMaker CSV file</Form.Label>
            <Form.Control
              type="file"
              accept=".csv,text/csv"
              onChange={chooseFile}
              disabled={mutation.isPending}
            />
          </Form.Group>
          {error && <Alert variant="danger">{error}</Alert>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Auditing…" : "Audit CSV"}
          </Button>
        </Form>

        {result && <CATMEAuditResults result={result} />}
      </Card.Body>
    </Card>
  );
}
