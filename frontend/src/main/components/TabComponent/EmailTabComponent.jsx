import React from "react";
import CategoricalCourseEmailsCard from "main/components/Emails/CategoricalCourseEmailsCard";

export default function EmailTabComponent({ courseId, testIdPrefix }) {
  return (
    <div data-testid={`${testIdPrefix}-EmailTabComponent`}>
      <CategoricalCourseEmailsCard
        courseId={courseId}
        testIdPrefix={`${testIdPrefix}-EmailTabComponent`}
      />
    </div>
  );
}
