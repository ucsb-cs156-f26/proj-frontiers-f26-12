import React from "react";
import { Button } from "react-bootstrap";

export default function CATMETabComponent({ courseId, testIdPrefix }) {
  const downloadCsv = () => {
    window.open(`/api/csv/catme?courseId=${courseId}`, "_blank");
  };

  return (
    <div data-testid={`${testIdPrefix}-catme-tab-component`}>
      <p>Download this course&apos;s roster for use in CATME.</p>
      <Button onClick={downloadCsv}>Download CSV Roster in CATME format</Button>
    </div>
  );
}
