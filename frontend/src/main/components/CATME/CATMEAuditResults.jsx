import { Alert, Table } from "react-bootstrap";

const displayValue = (value) => value || "Not provided";

function StudentTable({ students, label }) {
  return (
    <Table striped bordered responsive aria-label={label}>
      <thead>
        <tr>
          <th>Student ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Section</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student, index) => (
          <tr key={index}>
            <td>{student.studentId}</td>
            <td>{displayValue(student.name)}</td>
            <td>{displayValue(student.email)}</td>
            <td>{displayValue(student.section)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function CATMEAuditResults({ result }) {
  const { studentsToAdd, studentsToUpdate, studentsToDrop } = result;
  const hasDifferences =
    studentsToAdd.length + studentsToUpdate.length + studentsToDrop.length > 0;

  return (
    <section aria-label="CATME audit results" className="mt-3">
      <Alert variant={hasDifferences ? "warning" : "success"} role="status">
        <h3 className="h5">CATME audit results</h3>
        <p>
          Students to add: {studentsToAdd.length}. Fields to update:{" "}
          {studentsToUpdate.length}. Students to remove: {studentsToDrop.length}
          .
        </p>
        <p className="mb-0">
          {hasDifferences
            ? "Apply these changes in CATME, export a fresh file, and audit it again. Frontiers is the source of truth."
            : "No additions, updates, or removals were found."}
        </p>
      </Alert>

      {studentsToAdd.length > 0 && (
        <>
          <h4 className="h6">Add to CATME</h4>
          <StudentTable
            students={studentsToAdd}
            label="Students to add to CATME"
          />
        </>
      )}

      {studentsToUpdate.length > 0 && (
        <>
          <h4 className="h6">Update in CATME</h4>
          <Table
            striped
            bordered
            responsive
            aria-label="Fields to update in CATME"
          >
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name in Frontiers</th>
                <th>Field</th>
                <th>Current CATME value</th>
                <th>Correct Frontiers value</th>
              </tr>
            </thead>
            <tbody>
              {studentsToUpdate.map((update, index) => (
                <tr key={index}>
                  <td>{update.studentId}</td>
                  <td>{displayValue(update.name)}</td>
                  <td>{update.field}</td>
                  <td>{displayValue(update.oldValue)}</td>
                  <td>{displayValue(update.newValue)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {studentsToDrop.length > 0 && (
        <>
          <h4 className="h6">Remove from CATME</h4>
          <StudentTable
            students={studentsToDrop}
            label="Students to remove from CATME"
          />
        </>
      )}
    </section>
  );
}
