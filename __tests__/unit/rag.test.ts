/* eslint-disable import/first */
jest.mock("@/lib/data", () => ({
  listChunks: jest.fn(),
}));

import { retrieveContext, contextBlock } from "@/lib/rag";
import { listChunks } from "@/lib/data";

const mockListChunks = listChunks as jest.Mock;

function makeChunk(id: string, text: string, source = "url") {
  return { id, text, source, subjectId: "sub1", topicId: null, sourceId: null, embedding: null, createdAt: 0 };
}

beforeEach(() => mockListChunks.mockClear());

describe("retrieveContext", () => {
  it("returns empty array when no chunks exist", async () => {
    mockListChunks.mockReturnValue([]);
    const result = await retrieveContext("sub1", undefined, "photosynthesis");
    expect(result).toEqual([]);
  });

  it("returns empty array for an empty query", async () => {
    mockListChunks.mockReturnValue([makeChunk("1", "Plants convert sunlight to energy.")]);
    const result = await retrieveContext("sub1", undefined, "   ");
    expect(result).toEqual([]);
  });

  it("scores relevant chunks higher than irrelevant ones", async () => {
    mockListChunks.mockReturnValue([
      makeChunk("1", "Photosynthesis is the process by which plants convert sunlight into glucose using chlorophyll.", "bio"),
      makeChunk("2", "The French Revolution began in 1789 when citizens stormed the Bastille.", "hist"),
    ]);
    const results = await retrieveContext("sub1", undefined, "photosynthesis plants sunlight");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe("bio");
  });

  it("respects the limit parameter", async () => {
    const chunks = Array.from({ length: 10 }, (_, i) =>
      makeChunk(String(i), `Photosynthesis fact ${i} about light and chlorophyll pigments.`)
    );
    mockListChunks.mockReturnValue(chunks);
    const results = await retrieveContext("sub1", undefined, "photosynthesis", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("returns only chunks with a positive BM25 score", async () => {
    mockListChunks.mockReturnValue([makeChunk("1", "aardvark zebra xenon quartz")]);
    const results = await retrieveContext("sub1", undefined, "photosynthesis");
    expect(results).toEqual([]);
  });

  it("passes subjectId to listChunks", async () => {
    mockListChunks.mockReturnValue([]);
    await retrieveContext("my-subject", undefined, "anything");
    expect(mockListChunks).toHaveBeenCalledWith("my-subject");
  });
});

describe("contextBlock", () => {
  it("returns empty string for no chunks", () => {
    expect(contextBlock([])).toBe("");
  });

  it("formats chunks with numbered references", () => {
    const block = contextBlock([
      { text: "Chunk one text.", source: "url1", score: 1 },
      { text: "Chunk two text.", source: "url2", score: 0.5 },
    ]);
    expect(block).toContain("[1] Chunk one text.");
    expect(block).toContain("[2] Chunk two text.");
  });
});
