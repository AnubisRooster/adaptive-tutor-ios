/* eslint-disable import/first */
jest.mock("@/lib/html");
jest.mock("@/lib/data", () => ({
  createSource: jest.fn(),
  insertKnowledgeChunk: jest.fn(),
  updateSource: jest.fn(),
}));
jest.mock("@/lib/chunk");

import { ingestUrl } from "@/lib/ingest";
import { fetchPageText } from "@/lib/html";
import { createSource, insertKnowledgeChunk, updateSource } from "@/lib/data";
import { chunkText } from "@/lib/chunk";

const mockFetchPageText = fetchPageText as jest.Mock;
const mockCreateSource = createSource as jest.Mock;
const mockInsertChunk = insertKnowledgeChunk as jest.Mock;
const mockUpdateSource = updateSource as jest.Mock;
const mockChunkText = chunkText as jest.Mock;

const FAKE_SOURCE = {
  id: "src-1",
  subjectId: "sub1",
  topicId: null,
  kind: "url",
  name: "https://example.com",
  status: "pending",
  chunkCount: 0,
  embeddedCount: 0,
  error: null,
  createdAt: 0,
  updatedAt: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchPageText.mockResolvedValue("Some extracted page text.");
  mockChunkText.mockReturnValue(["chunk one", "chunk two", "chunk three"]);
  mockCreateSource.mockReturnValue(FAKE_SOURCE);
});

describe("ingestUrl", () => {
  it("calls fetchPageText with the provided URL", async () => {
    await ingestUrl("https://example.com", "sub1", null);
    expect(mockFetchPageText).toHaveBeenCalledWith("https://example.com");
  });

  it("creates a source record with correct fields", async () => {
    await ingestUrl("https://example.com/page", "sub1", "topic-1");
    expect(mockCreateSource).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: "sub1", topicId: "topic-1", kind: "url", name: "https://example.com/page" })
    );
  });

  it("inserts a chunk for each text segment", async () => {
    await ingestUrl("https://example.com", "sub1", null);
    expect(mockInsertChunk).toHaveBeenCalledTimes(3);
    expect(mockInsertChunk).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: "sub1", source: "https://example.com", sourceId: "src-1" })
    );
  });

  it("updates source status to ready with correct chunk count", async () => {
    await ingestUrl("https://example.com", "sub1", null);
    expect(mockUpdateSource).toHaveBeenCalledWith("src-1", { status: "ready", chunkCount: 3 });
  });

  it("reports progress phases in order", async () => {
    const phases: string[] = [];
    await ingestUrl("https://example.com", "sub1", null, (p) => phases.push(p.phase));
    expect(phases[0]).toBe("fetching");
    expect(phases[1]).toBe("chunking");
    expect(phases).toContain("saving");
    expect(phases[phases.length - 1]).toBe("done");
  });

  it("throws when fetchPageText throws", async () => {
    mockFetchPageText.mockRejectedValue(new Error("HTTP 404 fetching https://bad.url"));
    await expect(ingestUrl("https://bad.url", "sub1", null)).rejects.toThrow("HTTP 404");
  });

  it("throws when no text chunks are produced", async () => {
    mockChunkText.mockReturnValue([]);
    await expect(ingestUrl("https://example.com", "sub1", null)).rejects.toThrow(
      "No text content"
    );
  });
});
