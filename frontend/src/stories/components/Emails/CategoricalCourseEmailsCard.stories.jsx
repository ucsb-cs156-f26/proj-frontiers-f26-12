import React from "react";
import CategoricalCourseEmailsCard from "main/components/Emails/CategoricalCourseEmailsCard";
import { http, HttpResponse } from "msw";

export default {
  title: "components/Emails/CategoricalCourseEmailsCard",
  component: CategoricalCourseEmailsCard,
};

const Template = (args) => {
  return <CategoricalCourseEmailsCard {...args} />;
};

const staffList = ["cgaucho@ucsb.edu", "ldelplaya@ucsb.edu", "phtcon@ucsb.edu"];
const studentList = [
  "mordecai@ucsb.edu",
  "twilightsparkle@ucsb.edu",
  "willsmith@ucsb.edu",
];
// Answers in whichever format the dropdown asks for
const emailsHandler = http.get("/api/courses/emails", ({ request }) => {
  const format = new URL(request.url).searchParams.get("format");
  const type = new URL(request.url).searchParams.get("type");
  const team = new URL(request.url).searchParams.get("team");
  const studentEmails = team ? [] : studentList;
  const staffEmails = team ? [] : staffList;
  const emails =
    type === "ALL"
      ? studentEmails.concat(staffEmails)
      : type === "STAFF"
        ? staffEmails
        : studentEmails;
  return HttpResponse.text(
    format === "COMMA_SEPARATED" ? emails.join(",") : emails.join("\r\n"),
    { status: 200 },
  );
});

export const Teamless = Template.bind({});
Teamless.args = {
  courseId: 7,
};
Teamless.parameters = {
  msw: [emailsHandler],
};

export const Empty = Template.bind({});
Empty.args = {
  courseId: 7,
};
Empty.parameters = {
  msw: [
    http.get("/api/courses/emails", () => {
      return HttpResponse.text("", { status: 200 });
    }),
  ],
};
