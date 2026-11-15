import { Alert, Table } from "react-bootstrap";

export default function CourseStaffCSVUploadResult({ result }) {
  return (
    <Alert variant={result.errors.length > 0 ? "warning" : "success"}>
      <Alert.Heading as="h3">Staff CSV import results</Alert.Heading>
      <p>
        Staff added: {result.count}. Rows not imported: {result.errors.length}.
      </p>
      {result.errors.length > 0 && (
        <>
          <p>
            Correct the rows below and upload them again. Staff already on the
            roster have not been changed.
          </p>
          <Table responsive bordered size="sm">
            <caption>CSV row numbers include the header as row 1.</caption>
            <thead>
              <tr>
                <th scope="col">CSV row</th>
                <th scope="col">Email</th>
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              {result.errors.map((error) => (
                <tr key={error.row}>
                  <td>{error.row}</td>
                  <td>{error.email || "Not provided"}</td>
                  <td>{error.message}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </Alert>
  );
}
