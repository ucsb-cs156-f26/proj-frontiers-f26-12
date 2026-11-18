import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeamDropdown from "main/components/Teams/TeamDropdown";

const observed = { selected: undefined, real: false };
const { Typeahead: RealTypeahead } = await vi.importActual(
  "react-bootstrap-typeahead",
);

// Mock Typeahead
vi.mock("react-bootstrap-typeahead", () => ({
  Typeahead: (props) => {
    if (observed.real) {
      return <RealTypeahead {...props} />;
    }
    const {
      onChange,
      onInputChange,
      inputProps,
      placeholder,
      options,
      selected,
      disabled,
    } = props;

    observed.selected = selected;
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveProperty("id");
    expect(options[0]).toHaveProperty("name");
    if (selected.length > 0) {
      expect(selected).toHaveLength(1);
      expect(selected[0].name).toBe("team01");
    }

    onChange([{ id: 1, name: "team01" }]);
    onChange([]);

    if (onInputChange) {
      onInputChange("typed team");
    }

    return (
      <input
        data-testid={inputProps["data-testid"]}
        placeholder={placeholder}
        aria-label={inputProps["aria-label"]}
        className={inputProps.className}
        disabled={disabled}
      />
    );
  },
}));

const teams = [
  { id: 1, name: "team01", isStaffTeam: false },
  { id: 2, name: "team02", isStaffTeam: false },
];

describe("TeamDropdown tests", () => {
  test("renders invalid state and calls onChange correctly", () => {
    const mockOnChange = vi.fn();

    render(
      <TeamDropdown
        teams={teams}
        value="team01"
        onChange={mockOnChange}
        isInvalid={true}
      />,
    );

    expect(mockOnChange).toHaveBeenCalledWith("team01");
    expect(mockOnChange).not.toHaveBeenCalledWith("");
    expect(mockOnChange).toHaveBeenCalledWith("typed team");
    expect(screen.getByPlaceholderText("Select a team.")).toBeInTheDocument();

    const input = screen.getByTestId("TeamDropdown");
    expect(input.className).toBe("form-control is-invalid");
    expect(screen.getByLabelText("Select Team")).toBe(input);
    expect(input).not.toBeDisabled();
  });

  test("renders valid state with normal className", () => {
    render(
      <TeamDropdown
        teams={teams}
        value="team01"
        onChange={vi.fn()}
        isInvalid={false}
      />,
    );

    expect(observed.selected).toEqual([{ id: 1, name: "team01" }]);
    expect(screen.getByTestId("TeamDropdown").className).toBe("form-control");
  });

  test("can be disabled", () => {
    render(
      <TeamDropdown
        teams={teams}
        value=""
        onChange={vi.fn()}
        disabled={true}
      />,
    );

    expect(screen.getByTestId("TeamDropdown")).toBeDisabled();
  });

  test("does not select a team when the value does not match", () => {
    render(
      <TeamDropdown
        teams={teams}
        value="missing-team"
        onChange={vi.fn()}
        isInvalid={false}
      />,
    );

    expect(observed.selected).toHaveLength(0);
  });

  test("clears typed text when value is reset to empty string", async () => {
    observed.real = true;
    const user = userEvent.setup();

    const { rerender } = render(
      <TeamDropdown teams={teams} value="" onChange={vi.fn()} />,
    );

    const input = screen.getByTestId("TeamDropdown");
    await user.type(input, "tea");
    rerender(<TeamDropdown teams={teams} value="tea" onChange={vi.fn()} />);
    expect(input).toHaveValue("tea");

    rerender(<TeamDropdown teams={teams} value="" onChange={vi.fn()} />);
    expect(input).toHaveValue("");
    observed.real = false;
  });

  test("keeps typed text when backspacing a selected team", async () => {
    observed.real = true;
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    const { rerender } = render(
      <TeamDropdown teams={teams} value="team01" onChange={mockOnChange} />,
    );

    const input = screen.getByTestId("TeamDropdown");
    await user.type(input, "{backspace}");
    expect(mockOnChange).toHaveBeenLastCalledWith("team0");

    rerender(
      <TeamDropdown teams={teams} value="team0" onChange={mockOnChange} />,
    );
    expect(input).toHaveValue("team0");
    observed.real = false;
  });
});
