import SortCaret from "main/components/Common/SortCaret";

export default {
  title: "components/Common/SortCaret",
  component: SortCaret,
  argTypes: {
    header: { table: { disable: true } },
    canSort: {
      control: "boolean",
      description: "Whether the column allows sorting.",
    },
    sortDirection: {
      control: "select",
      options: ["unsorted", "asc", "desc"],
      description: "The current column sort state.",
    },
  },
  args: {
    canSort: true,
    sortDirection: "asc",
    testId: "sort-caret-story",
  },
};

const Template = ({ canSort, sortDirection, testId }) => {
  const header = {
    column: {
      id: "course",
      getCanSort: () => canSort,
      getIsSorted: () => (sortDirection === "unsorted" ? false : sortDirection),
    },
  };

  return (
    <table className="table table-bordered w-auto">
      <thead>
        <tr>
          <th scope="col">
            Course <SortCaret header={header} testId={testId} />
          </th>
        </tr>
      </thead>
    </table>
  );
};

export const Ascending = Template.bind({});

export const Descending = Template.bind({});
Descending.args = { sortDirection: "desc" };

export const Unsorted = Template.bind({});
Unsorted.args = { sortDirection: "unsorted" };

export const NonSortable = Template.bind({});
NonSortable.args = { canSort: false };
