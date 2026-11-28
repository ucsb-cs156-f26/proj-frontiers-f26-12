import { expect, userEvent, within } from "storybook/test";
import RepositorySelectionForm from "main/components/RepositorySelectionForm";
import collectionNames from "fixtures/collectionNames";

export default {
  title: "components/RepositorySelectionForm",
  component: RepositorySelectionForm,
  argTypes: {
    collections: {
      control: "object",
      description:
        "Names of the existing collections, used to flag duplicate names.",
    },
  },
  args: {
    collections: [],
  },
};

const Template = (args) => <RepositorySelectionForm {...args} />;

export const NoCollections = Template.bind({});

export const ExistingCollections = Template.bind({});
ExistingCollections.args = {
  collections: collectionNames.collectionNamesForOneCourse,
};

export const DuplicateCollectionName = Template.bind({});
DuplicateCollectionName.args = {
  collections: collectionNames.collectionNamesForOneCourse,
};
DuplicateCollectionName.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.type(
    canvas.getByTestId("collection-name-input"),
    collectionNames.collectionNamesForOneCourse[0],
  );
  await expect(
    canvas.getByText("Collection name already exists"),
  ).toBeInTheDocument();
};

export const InvalidRepositoryUrl = Template.bind({});
InvalidRepositoryUrl.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByTestId("URL-input"), "not-a-github-url");
  await userEvent.tab();
  await expect(
    canvas.getByText(
      "Please enter a valid GitHub repository or organization URL",
    ),
  ).toBeInTheDocument();
};

export const VerifiedInputs = Template.bind({});
VerifiedInputs.args = {
  collections: collectionNames.collectionNamesForOneCourse,
};
VerifiedInputs.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.type(
    canvas.getByTestId("collection-name-input"),
    "CS156-2026-01",
  );
  await userEvent.type(
    canvas.getByTestId("URL-input"),
    "https://github.com/ucsb-cs156-f26",
  );
  await userEvent.tab();
  await expect(
    canvas.getByText("Collection name is available"),
  ).toBeInTheDocument();
  await expect(canvas.getByTestId("url-success-message")).toHaveTextContent(
    "Verified",
  );
};
