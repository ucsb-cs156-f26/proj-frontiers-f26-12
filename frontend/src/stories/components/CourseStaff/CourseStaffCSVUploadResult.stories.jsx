import CourseStaffCSVUploadResult from "main/components/CourseStaff/CourseStaffCSVUploadResult";

export default {
  title: "components/CourseStaff/CourseStaffCSVUploadResult",
  component: CourseStaffCSVUploadResult,
};

export const AllValid = {
  args: { result: { count: 2, errors: [] } },
};

export const MixedResults = {
  args: {
    result: {
      count: 2,
      errors: [
        {
          row: 3,
          email: "existing@example.com",
          message: "Email is already on this course's staff.",
        },
        {
          row: 4,
          email: "new@example.com",
          message: "Email is repeated in this CSV file.",
        },
        { row: 5, email: "", message: "Email is required." },
      ],
    },
  },
};

export const AllRejected = {
  args: { result: { ...MixedResults.args.result, count: 0 } },
};
