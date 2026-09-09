/* eslint-disable import/first, @typescript-eslint/no-require-imports */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SearchScreen from "@/app/search";

jest.mock("expo-router", () => {
  const ctx = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
  return { useRouter: () => ctx, __getRouter: () => ctx };
});
jest.mock("@/lib/session", () => ({
  getActiveStudentId: jest.fn().mockResolvedValue("stu-1"),
}));
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/lib/data", () => ({
  getStudent: jest.fn(),
  listSubjects: jest.fn(),
  getAllTopics: jest.fn(),
  listChunks: jest.fn(),
}));
jest.mock("@/lib/rag", () => ({
  searchChunks: jest.fn(),
}));

import { getStudent, listSubjects, getAllTopics, listChunks } from "@/lib/data";
import { searchChunks } from "@/lib/rag";
import { getActiveStudentId } from "@/lib/session";

const mockGetStudent = getStudent as jest.Mock;
const mockListSubjects = listSubjects as jest.Mock;
const mockGetAllTopics = getAllTopics as jest.Mock;
const mockListChunks = listChunks as jest.Mock;
const mockSearchChunks = searchChunks as jest.Mock;
const mockGetActiveStudentId = getActiveStudentId as jest.Mock;
const router = (
  require("expo-router") as { __getRouter: () => { replace: jest.Mock; push: jest.Mock; back: jest.Mock } }
).__getRouter();

function chunk(subjectId: string, topicId: string | null, source: string, text: string) {
  return { id: "c1", subjectId, topicId, source, text, score: 0, sourceId: null, embedding: null, createdAt: 0 };
}

beforeEach(() => {
  mockGetActiveStudentId.mockResolvedValue("stu-1");
  mockGetStudent.mockReturnValue({ id: "stu-1", name: "Alice", color: "#6366f1" });
  mockListSubjects.mockReturnValue([{ id: "bio", name: "Biology" }]);
  mockGetAllTopics.mockReturnValue([{ id: "t1", subjectId: "bio", name: "Photosynthesis" }]);
  mockListChunks.mockReturnValue([
    chunk("bio", "t1", "my notes", "Photosynthetic plants convert light to energy."),
  ]);
  mockSearchChunks.mockReset();
  router.replace.mockClear();
  router.push.mockClear();
});

describe("SearchScreen", () => {
  it("redirects to home when no active student exists", async () => {
    mockGetActiveStudentId.mockResolvedValue(null);
    await render(<SearchScreen />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("guides to adding material when the library is empty", async () => {
    mockListChunks.mockReturnValue([]);
    const { findByTestId } = await render(<SearchScreen />);
    await findByTestId("search-add-material");
    await fireEvent.press(await findByTestId("search-add-material"));
    expect(router.push).toHaveBeenCalledWith("/ingest");
  });

  it("debounces, runs, and renders ranked results", async () => {
    mockSearchChunks.mockReturnValue([
      { subjectId: "bio", topicId: "t1", source: "my notes", text: "Photosynthetic plants convert light to energy.", score: 1.2 },
    ]);
    const { getByTestId, findByText } = await render(<SearchScreen />);
    await findByText(/What are you studying today\?/);
    await fireEvent.changeText(getByTestId("search-input"), "photosynthesis light");
    await findByText(/Photosynthetic plants convert light to energy\./);
    await findByText("Biology");
    await findByText(/Photosynthesis/);
    expect(mockSearchChunks).toHaveBeenCalledWith("photosynthesis light", 25);
  });

  it("opens the matching lesson when a result is tapped", async () => {
    mockSearchChunks.mockReturnValue([
      { subjectId: "bio", topicId: "t1", source: "my notes", text: "Photosynthetic plants convert light to energy.", score: 1.2 },
    ]);
    const { getByTestId, findByTestId } = await render(<SearchScreen />);
    await fireEvent.changeText(getByTestId("search-input"), "photosynthesis");
    const row = await findByTestId("search-row-0");
    await fireEvent.press(row);
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/learn",
      params: { subjectId: "bio", topicId: "t1" },
    });
  });

  it("shows a no-results state when nothing matches", async () => {
    mockSearchChunks.mockReturnValue([]);
    const { getByTestId, findByText } = await render(<SearchScreen />);
    await fireEvent.changeText(getByTestId("search-input"), "zzz nothing here");
    await findByText(/No results for .*zzz nothing here/);
  });

  it("clears results via the header Clear action", async () => {
    mockSearchChunks.mockReturnValue([
      { subjectId: "bio", topicId: "t1", source: "my notes", text: "Photosynthetic plants convert light to energy.", score: 1 },
    ]);
    const { getByTestId, findByTestId, queryByText } = await render(<SearchScreen />);
    await fireEvent.changeText(getByTestId("search-input"), "photosynthesis");
    await findByTestId("search-row-0");
    await fireEvent.press(getByTestId("search-clear"));
    await waitFor(() => expect(queryByText(/Photosynthetic plants/)).toBeNull());
  });
});