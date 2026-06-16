/* eslint-disable import/first */
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/lib/data", () => ({
  listSubjects: jest.fn(() => [
    { id: "sub1", name: "Biology", description: "", icon: "", color: "#6366f1", createdAt: 0 },
  ]),
  listTopics: jest.fn(() => [
    { id: "t1", subjectId: "sub1", name: "Photosynthesis", description: "", bloomLevel: 1, order: 0, createdAt: 0 },
  ]),
  listSources: jest.fn(() => []),
}));

jest.mock("@/lib/ingest", () => ({
  ingestUrl: jest.fn(),
}));

import { render, fireEvent } from "@testing-library/react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import IngestScreen from "@/app/ingest";
import { ingestUrl } from "@/lib/ingest";

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
const mockIngestUrl = ingestUrl as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  (useLocalSearchParams as jest.Mock).mockReturnValue({ subjectId: "sub1" });
  mockIngestUrl.mockResolvedValue({ sourceId: "src-1", chunkCount: 5 });
});

describe("IngestScreen", () => {
  it("renders URL input and ingest button", async () => {
    const { getByTestId } = await render(<IngestScreen />);
    expect(getByTestId("url-input")).toBeTruthy();
    expect(getByTestId("ingest-btn")).toBeTruthy();
  });

  it("ingest button is disabled when URL is empty", async () => {
    const { getByTestId } = await render(<IngestScreen />);
    const btn = getByTestId("ingest-btn");
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it("shows ingesting phase while processing", async () => {
    mockIngestUrl.mockImplementationOnce(() => new Promise(() => {}));
    const { getByTestId, findByTestId } = await render(<IngestScreen />);
    await fireEvent.changeText(getByTestId("url-input"), "https://example.com");
    // Don't await — the never-resolving ingestUrl would hang act(); setPhase("ingesting")
    // is synchronous so findByTestId will resolve as soon as React flushes that update.
    void fireEvent.press(getByTestId("ingest-btn"));
    await findByTestId("phase-ingesting");
  });

  it("shows done state after successful ingest", async () => {
    const { getByTestId } = await render(<IngestScreen />);
    await fireEvent.changeText(getByTestId("url-input"), "https://example.com");
    await fireEvent.press(getByTestId("ingest-btn"));
    expect(getByTestId("phase-done")).toBeTruthy();
  });

  it("shows error state when ingest fails", async () => {
    mockIngestUrl.mockRejectedValueOnce(new Error("HTTP 403 forbidden"));
    const { getByTestId } = await render(<IngestScreen />);
    await fireEvent.changeText(getByTestId("url-input"), "https://blocked.com");
    await fireEvent.press(getByTestId("ingest-btn"));
    expect(getByTestId("phase-error")).toBeTruthy();
  });

  it("navigates back when back button is pressed", async () => {
    const { getByTestId } = await render(<IngestScreen />);
    await fireEvent.press(getByTestId("back-btn"));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
