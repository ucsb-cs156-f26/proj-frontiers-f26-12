export const catmeAuditFixtures = {
  clean: {
    studentsToAdd: [],
    studentsToUpdate: [],
    studentsToDrop: [],
  },
  differences: {
    studentsToAdd: [
      {
        studentId: "9000002",
        name: "New, Bob",
        email: "bob.new@example.com",
        section: "0200",
      },
    ],
    studentsToUpdate: [
      {
        studentId: "9000001",
        name: "Roster, Alice",
        field: "Name",
        oldValue: "Old, Alice",
        newValue: "Roster, Alice",
      },
      {
        studentId: "9000001",
        name: "Roster, Alice",
        field: "Section",
        oldValue: "0200",
        newValue: "0100",
      },
    ],
    studentsToDrop: [
      {
        studentId: "9000003",
        name: "Former, Casey",
        email: "casey.former@example.com",
        section: "0100",
      },
    ],
  },
};
