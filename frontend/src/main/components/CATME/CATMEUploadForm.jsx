import { useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { useBackendMutation } from "main/utils/useBackend";

export default function CATMEUploadForm({ courseId, config, children }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const mutation = useBackendMutation(
    (selectedFile) => {
      const data = new FormData();
      data.append("file", selectedFile);
      return {
        method: "POST",
        url: `/api/catme/${config.endpoint}`,
        params: { courseId },
        data,
      };
    },
    {
      onSuccess: setResult,
      onError: (failure) =>
        setError(failure.response?.data?.message ?? config.errorMessage),
    },
  );

  const submit = (event) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setResult(null);
    if (!file) {
      setError(config.missingFileMessage);
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
    <>
      <Form onSubmit={submit} noValidate aria-label={config.formLabel}>
        <Form.Group
          className="mb-3"
          controlId={`catme-${config.endpoint}-file-${courseId}`}
        >
          <Form.Label>{config.fileLabel}</Form.Label>
          <Form.Control
            type="file"
            accept=".csv,text/csv"
            onChange={chooseFile}
            disabled={mutation.isPending}
          />
        </Form.Group>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? config.pendingLabel : config.buttonLabel}
        </Button>
      </Form>
      {result && children(result)}
    </>
  );
}
