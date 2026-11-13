import React from "react";
import CategoricalCourseEmailsCard from "main/components/Emails/CategoricalCourseEmailsCard";
// import { categoricalCourseEmailsQueryKey } from "main/utils/categoricalCourseEmailsUtils";

export default function StaffTabComponent({ courseId, testIdPrefix }) {
  return (
    <div data-testid={`${testIdPrefix}-EmailTabComponent`}>
      <CategoricalCourseEmailsCard
        courseId={courseId}
        testIdPrefix={`${testIdPrefix}-EmailTabComponent`}
      />
    </div>
  );
}
