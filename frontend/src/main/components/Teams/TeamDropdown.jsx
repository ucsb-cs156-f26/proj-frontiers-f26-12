import { useEffect, useRef } from "react";
import { Typeahead } from "react-bootstrap-typeahead";
import { Form } from "react-bootstrap";
import "react-bootstrap-typeahead/css/Typeahead.css";

export default function TeamDropdown({
  teams,
  value,
  onChange,
  isInvalid,
  disabled = false,
  testId = "TeamDropdown",
}) {
  const typeaheadRef = useRef(null);

  useEffect(() => {
    if (value === "" && typeaheadRef.current?.getInput().value) {
      typeaheadRef.current.clear();
    }
  }, [value]);

  const options = teams.map((team) => ({
    id: team.id,
    name: team.name,
  }));

  const selectedOption = options.filter((option) => option.name === value);

  const handleSelectionChange = (selected) => {
    if (selected.length > 0) {
      onChange(selected[0].name);
    }
  };

  return (
    <Form.Group controlId="team">
      <Typeahead
        ref={typeaheadRef}
        id="team-typeahead"
        options={options}
        labelKey="name"
        placeholder="Select a team."
        selected={selectedOption}
        onChange={handleSelectionChange}
        onInputChange={(text) => onChange(text)}
        highlightOnlyResult
        disabled={disabled}
        inputProps={{
          "aria-label": "Select Team",
          "data-testid": testId,
          className: isInvalid ? "form-control is-invalid" : "form-control",
        }}
      />
    </Form.Group>
  );
}
