import CATMEAuditResults from "main/components/CATME/CATMEAuditResults";
import { catmeAuditFixtures } from "fixtures/catmeAuditFixtures";

export default {
  title: "components/CATME/CATMEAuditResults",
  component: CATMEAuditResults,
};

export const Differences = {
  args: { result: catmeAuditFixtures.differences },
};

export const NoDifferences = {
  args: { result: catmeAuditFixtures.clean },
};

export const AdditionsOnly = {
  args: {
    result: {
      ...catmeAuditFixtures.clean,
      studentsToAdd: catmeAuditFixtures.differences.studentsToAdd,
    },
  },
};
