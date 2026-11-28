import { expect, fn, userEvent, within } from "storybook/test";
import UpdateInstructorForm from "main/components/Courses/UpdateInstructorForm";
import coursesFixtures from "fixtures/coursesFixtures";

const course = coursesFixtures.severalCourses[0];

export default {
  title: "components/Courses/UpdateInstructorForm",
  component: UpdateInstructorForm,
  argTypes: {
    initialContents: {
      control: "object",
      description: "The course name and current instructor email to prefill.",
    },
    handleUpdateInstructor: { table: { disable: true } },
  },
  args: {
    initialContents: {
      courseName: course.courseName,
      instructorEmail: course.instructorEmail,
    },
    handleUpdateInstructor: fn(),
  },
};

const Template = (args) => (
  <div style={{ maxWidth: "32rem" }}>
    <UpdateInstructorForm {...args} />
  </div>
);

export const Default = Template.bind({});

export const SubmitNewInstructor = Template.bind({});
SubmitNewInstructor.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  const email = canvas.getByTestId("update-instructor-email-input");
  await userEvent.clear(email);
  await userEvent.type(email, "newinstructor@ucsb.edu");
  await userEvent.click(canvas.getByTestId("update-instructor-submit-button"));
  await expect(args.handleUpdateInstructor).toHaveBeenCalledTimes(1);
  await expect(args.handleUpdateInstructor.mock.calls[0][0]).toEqual({
    courseName: course.courseName,
    instructorEmail: "newinstructor@ucsb.edu",
  });
};

export const EmailRequired = Template.bind({});
EmailRequired.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.clear(canvas.getByTestId("update-instructor-email-input"));
  await userEvent.click(canvas.getByTestId("update-instructor-submit-button"));
  await expect(
    await canvas.findByText("Instructor email is required."),
  ).toBeInTheDocument();
  await expect(args.handleUpdateInstructor).not.toHaveBeenCalled();
};

// The email input has type="email", so the browser itself rejects a
// malformed address before the form is submitted.
export const InvalidEmail = Template.bind({});
InvalidEmail.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  const email = canvas.getByTestId("update-instructor-email-input");
  await userEvent.clear(email);
  await userEvent.type(email, "not-an-email");
  await userEvent.click(canvas.getByTestId("update-instructor-submit-button"));
  await expect(email.validity.typeMismatch).toBe(true);
  await expect(args.handleUpdateInstructor).not.toHaveBeenCalled();
};
