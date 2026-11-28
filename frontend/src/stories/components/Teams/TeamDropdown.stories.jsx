import React, { useEffect, useState } from "react";
import TeamDropdown from "main/components/Teams/TeamDropdown";
import { teamsFixtures } from "fixtures/TeamsFixtures";

export default {
  title: "components/Teams/TeamDropdown",
  component: TeamDropdown,
};

const Template = (args) => {
  const [value, setValue] = useState(args.value);

  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
    <TeamDropdown
      {...args}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        args.onChange(newValue);
      }}
    />
  );
};

export const Default = Template.bind({});

Default.args = {
  teams: teamsFixtures.teams,
  value: teamsFixtures.teams[0].name,
  onChange: (value) => {
    console.log("Selected team: ", value);
  },
  isInvalid: false,
};
