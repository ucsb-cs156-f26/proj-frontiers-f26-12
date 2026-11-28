import { render, screen, within } from "@testing-library/react";
import CATMEAuditResults from "main/components/CATME/CATMEAuditResults";
import { catmeAuditFixtures } from "fixtures/catmeAuditFixtures";

describe("CATMEAuditResults", () => {
  test("shows a clean audit without empty tables", () => {
    render(<CATMEAuditResults result={catmeAuditFixtures.clean} />);
    expect(screen.getByRole("status")).toHaveClass("alert-success");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Students to add: 0. Fields to update: 0. Students to remove: 0.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No additions, updates, or removals were found.",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  test("explains all discrepancies with CATME and Frontiers values in the correct columns", () => {
    render(<CATMEAuditResults result={catmeAuditFixtures.differences} />);
    expect(
      screen.getByRole("region", { name: "CATME audit results" }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveClass("alert-warning");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Students to add: 1. Fields to update: 2. Students to remove: 1.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Apply these changes in CATME, export a fresh file, and audit it again. Frontiers is the source of truth.",
    );

    const additions = screen.getByRole("table", {
      name: "Students to add to CATME",
    });
    expect(
      within(additions)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Student ID", "Name", "Email", "Section"]);
    expect(
      within(within(additions).getAllByRole("row")[1])
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["9000002", "New, Bob", "bob.new@example.com", "0200"]);

    const updates = screen.getByRole("table", {
      name: "Fields to update in CATME",
    });
    expect(
      within(updates)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual([
      "Student ID",
      "Name in Frontiers",
      "Field",
      "Current CATME value",
      "Correct Frontiers value",
    ]);
    const updateRows = within(updates).getAllByRole("row");
    expect(
      within(updateRows[1])
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual([
      "9000001",
      "Roster, Alice",
      "Name",
      "Old, Alice",
      "Roster, Alice",
    ]);
    expect(
      within(updateRows[2])
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["9000001", "Roster, Alice", "Section", "0200", "0100"]);

    const removals = screen.getByRole("table", {
      name: "Students to remove from CATME",
    });
    expect(
      within(within(removals).getAllByRole("row")[1])
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["9000003", "Former, Casey", "casey.former@example.com", "0100"]);
  });

  test.each([
    ["studentsToAdd", "Students to add to CATME"],
    ["studentsToUpdate", "Fields to update in CATME"],
    ["studentsToDrop", "Students to remove from CATME"],
  ])(
    "treats %s alone as differences and shows only its table",
    (field, tableName) => {
      render(
        <CATMEAuditResults
          result={{
            ...catmeAuditFixtures.clean,
            [field]: catmeAuditFixtures.differences[field],
          }}
        />,
      );
      expect(screen.getByRole("status")).toHaveClass("alert-warning");
      expect(screen.getAllByRole("table")).toHaveLength(1);
      expect(screen.getByRole("table", { name: tableName })).toBeVisible();
    },
  );

  test("identifies missing values rather than displaying unexplained blank cells", () => {
    render(
      <CATMEAuditResults
        result={{
          studentsToAdd: [
            { studentId: "1", name: null, email: "", section: null },
          ],
          studentsToUpdate: [
            {
              studentId: "2",
              name: "",
              field: "Section",
              oldValue: null,
              newValue: "",
            },
          ],
          studentsToDrop: [],
        }}
      />,
    );
    expect(screen.getAllByText("Not provided")).toHaveLength(6);
  });
});
