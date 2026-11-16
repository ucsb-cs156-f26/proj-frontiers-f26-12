import React from "react";
import { Button } from "react-bootstrap";
import CATMEAuditCard from "main/components/CATME/CATMEAuditCard";
import CATMETeamUploadCard from "main/components/CATME/CATMETeamUploadCard";

export default function CATMETabComponent({
  courseId,
  testIdPrefix,
  courseViewPath = "instructor",
}) {
  const downloadCsv = () => {
    window.open(`/api/csv/catme?courseId=${courseId}`, "_blank");
  };

  return (
    <div data-testid={`${testIdPrefix}-catme-tab-component`}>
      <p>Download this course&apos;s roster for use in CATME.</p>
      <Button onClick={downloadCsv}>Download CSV Roster in CATME format</Button>
      <CATMEAuditCard key={courseId} courseId={courseId} />
      <CATMETeamUploadCard
        key={`teams-${courseId}`}
        courseId={courseId}
        courseViewPath={courseViewPath}
      />
    </div>
  );
}
