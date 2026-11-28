import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CATMETabComponent from "main/components/TabComponent/CATMETabComponent";

describe("CATMETabComponent", () => {
  test("downloads the selected course's roster and follows course changes", () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const { rerender } = render(
      <CATMETabComponent courseId={7} testIdPrefix="CATME" />,
      { wrapper },
    );

    expect(screen.getByTestId("CATME-catme-tab-component")).toBeVisible();
    expect(
      screen.getByText("Download this course's roster for use in CATME."),
    ).toBeVisible();
    const downloadButton = screen.getByRole("button", {
      name: "Download CSV Roster in CATME format",
    });
    expect(openSpy).not.toHaveBeenCalled();

    fireEvent.click(downloadButton);
    expect(openSpy).toHaveBeenCalledExactlyOnceWith(
      "/api/csv/catme?courseId=7",
      "_blank",
    );

    rerender(<CATMETabComponent courseId={42} testIdPrefix="CATME" />);
    fireEvent.click(downloadButton);
    expect(openSpy).toHaveBeenCalledTimes(2);
    expect(openSpy).toHaveBeenLastCalledWith(
      "/api/csv/catme?courseId=42",
      "_blank",
    );
    openSpy.mockRestore();
  });
});
