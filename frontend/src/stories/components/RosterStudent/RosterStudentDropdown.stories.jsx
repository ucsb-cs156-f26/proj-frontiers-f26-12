import { useState } from "react";
import { fn } from "storybook/test";
import RosterStudentDropdown from "main/components/RosterStudent/RosterStudentDropdown";
import { rosterStudentFixtures } from "fixtures/rosterStudentFixtures";

export default {
  title: "components/RosterStudent/RosterStudentDropdown",
  component: RosterStudentDropdown,
  argTypes: {
    rosterStudents: {
      control: "object",
      description: "The roster students offered as options.",
    },
    value: {
      control: false,
      description:
        "The starting value: a roster student id, typed text, or an empty string.",
    },
    isInvalid: {
      control: "boolean",
      description: "Whether to show the input with invalid styling.",
    },
    onChange: { table: { disable: true } },
  },
  args: {
    rosterStudents: rosterStudentFixtures.threeStudents,
    value: "",
    isInvalid: false,
    onChange: fn(),
  },
};

// The component is controlled, so this wrapper keeps the value in state the
// way a parent form would. Selecting, typing, and clearing all update it, and
// every change is also logged in the Actions panel.
const Template = ({ value: initialValue, onChange, isInvalid, ...args }) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = (newValue) => {
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div style={{ maxWidth: "24rem" }}>
      <RosterStudentDropdown
        {...args}
        value={value}
        onChange={handleChange}
        isInvalid={isInvalid}
      />
      {isInvalid && (
        <div className="invalid-feedback d-block">Select a student.</div>
      )}
      <p className="mt-3 mb-0" data-testid="RosterStudentDropdown-story-value">
        Current value: {value === "" ? "(none)" : JSON.stringify(value)}
      </p>
    </div>
  );
};

export const EmptyRoster = Template.bind({});
EmptyRoster.args = {
  rosterStudents: [],
};

export const PopulatedRoster = Template.bind({});

export const PreselectedStudent = Template.bind({});
PreselectedStudent.args = {
  value: rosterStudentFixtures.threeStudents[1].id,
};

export const InvalidInput = Template.bind({});
InvalidInput.args = {
  isInvalid: true,
};
