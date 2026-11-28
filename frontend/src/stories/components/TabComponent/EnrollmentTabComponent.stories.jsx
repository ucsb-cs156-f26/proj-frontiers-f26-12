import EnrollmentTabComponent from "main/components/TabComponent/EnrollmentTabComponent";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import coursesFixtures from "fixtures/coursesFixtures";
import { rosterStudentFixtures } from "fixtures/rosterStudentFixtures";
import { sectionsFixtures } from "fixtures/sectionsFixtures";
import { http, HttpResponse } from "msw";
import { toast } from "react-toastify";

const course = { ...coursesFixtures.oneCourseWithEachStatus[0], id: 7 };
const students = rosterStudentFixtures.threeStudents.map((student, index) => ({
  ...student,
  course,
  rosterStatus: "MANUAL",
  orgStatus: ["MEMBER", "INVITED", "JOINCOURSE"][index],
  githubLogin: ["alicebrown", "tomhanks", null][index],
  teams: [["team-alpha"], ["team-beta"], []][index],
}));
const droppedStudent = {
  ...students[0],
  id: 8,
  studentId: "D123456",
  firstName: "Arya",
  lastName: "Sue",
  email: "aryasue@ucsb.edu",
  githubLogin: "aryasue",
  rosterStatus: "DROPPED",
  teams: [],
};
const importedStudent = {
  ...students[0],
  id: 90,
  studentId: "N123456",
  firstName: "Casey",
  lastName: "Gaucho",
  email: "caseygaucho@ucsb.edu",
  githubLogin: null,
  orgStatus: "JOINCOURSE",
  teams: [],
};

export default {
  title: "components/TabComponent/EnrollmentTabComponent",
  component: EnrollmentTabComponent,
  args: {
    courseId: course.id,
    testIdPrefix: "EnrollmentTabComponent",
    currentUser: currentUserFixtures.instructorUser,
    canEditStudents: true,
    translateSections: false,
    canvasEnabled: false,
  },
  argTypes: {
    courseId: { control: false },
    currentUser: { control: false },
    testIdPrefix: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Standalone course roster with mocked reads and mutations. Search Alice, tomhanks, or a student ID; combine section and team filters. Add, edit, restore, delete, and purge update only this preview. Uploading any CSV or confirming Canvas sync adds the deterministic Casey Gaucho example (the file is not parsed). Download/help actions display a preview toast. Reopening a story resets its data.",
      },
    },
  },
};

// Each story owns its mock roster; reset it on entry, including sidebar revisits.
function rosterStory(initialStudents, args = {}) {
  let roster = structuredClone(initialStudents);
  let nextId = 100;
  const addImport = () => {
    const created = roster.some((student) => student.id === importedStudent.id)
      ? 0
      : 1;
    if (created) roster = [...roster, structuredClone(importedStudent)];
    return HttpResponse.json({ created, updated: 0, rejected: [] });
  };

  return {
    args,
    beforeEach: () => {
      roster = structuredClone(initialStudents);
      nextId = 100;
      const originalOpen = window.open;
      window.open = (url) => {
        toast(`Storybook preview: would open ${url}`);
        return null;
      };
      return () => {
        window.open = originalOpen;
      };
    },
    parameters: {
      msw: {
        handlers: [
          http.get(`/api/rosterstudents/course/${course.id}`, () =>
            HttpResponse.json(roster),
          ),
          http.get(`/api/courses/${course.id}/sections`, () =>
            HttpResponse.json(sectionsFixtures.threeSections),
          ),
          http.post("/api/rosterstudents/post", ({ request }) => {
            const params = new URL(request.url).searchParams;
            const student = {
              ...importedStudent,
              ...Object.fromEntries(params),
              id: nextId++,
              section: params.get("section") || "",
            };
            roster = [...roster, student];
            return HttpResponse.json(student);
          }),
          http.post("/api/rosterstudents/upload/csv", addImport),
          http.post("/api/courses/canvas/sync/students", addImport),
          http.put("/api/rosterstudents/update", ({ request }) => {
            const params = new URL(request.url).searchParams;
            roster = roster.map((student) =>
              student.id === Number(params.get("id"))
                ? { ...student, ...Object.fromEntries(params), id: student.id }
                : student,
            );
            return HttpResponse.json({});
          }),
          http.put("/api/rosterstudents/restore", ({ request }) => {
            const id = Number(new URL(request.url).searchParams.get("id"));
            roster = roster.map((student) =>
              student.id === id
                ? { ...student, rosterStatus: "MANUAL" }
                : student,
            );
            return HttpResponse.json({});
          }),
          http.delete("/api/rosterstudents/delete", ({ request }) => {
            const id = Number(new URL(request.url).searchParams.get("id"));
            roster = roster.filter((student) => student.id !== id);
            return HttpResponse.json({});
          }),
          http.delete("/api/rosterstudents/purgeDropped", () => {
            const deleted = roster.filter(
              (student) => student.rosterStatus === "DROPPED",
            ).length;
            roster = roster.filter(
              (student) => student.rosterStatus !== "DROPPED",
            );
            return HttpResponse.json({ deleted, orgRemovalErrors: [] });
          }),
        ],
      },
    },
  };
}

export const PopulatedRoster = rosterStory([...students, droppedStudent]);

export const EmptyRoster = rosterStory([]);

export const TranslatedSectionsAndCanvas = rosterStory(
  [...students, droppedStudent],
  { translateSections: true, canvasEnabled: true },
);
