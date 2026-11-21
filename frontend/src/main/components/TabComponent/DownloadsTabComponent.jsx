import React from "react";
import CourseDownloadsForm from "../Courses/CourseDownloadsForm";
import { toast } from "react-toastify";

export default function DownloadsTabComponent({ courseId, testIdPrefix }) {
  const onSuccessDownloadTriggered = () => {
    toast("Download successfully initiated.");
  };

  const handleSubmit = () => {
    console.log(`Frontend form submit action captured for course: ${courseId}`);
    onSuccessDownloadTriggered();
  };

  const downloadTeamsCsv = () => {
    window.open(`/api/csv/nameandteam?courseId=${courseId}`, "_blank");
  };

  return (
    <div data-testid={`${testIdPrefix}-downloadsTab`}>
      <CourseDownloadsForm
        downloadAction={handleSubmit}
        teamsDownloadAction={downloadTeamsCsv}
        testIdPrefix={testIdPrefix}
      />
    </div>
  );
}
