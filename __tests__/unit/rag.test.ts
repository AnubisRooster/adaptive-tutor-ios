/* eslint-disable import/first */
jest.mock("@/lib/data", () => ({
  listChunks: jest.fn(),
  listSubjects: jest.fn(),
}));

import { retrieveContext, contextBlock, searchChunks } from "@/lib/rag";
import { listChunks, listSubjects } from "@/lib/data";

const mockListChunks = listChunks as jest.Mock;
const mockListSubjects = listSubjects as jest.Mock;

function makeChunk(id: string, text: string, source = "url") {
  return { id, text, source, subjectId: "sub1", topicId: null, sourceId: null, embedding: null, createdAt: 0 };
}

beforeEach(() => {
  mockListChunks.mockClear();
  mockListSubjects.mockClear();
});

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

describe("searchChunks", () => {
  beforeEach(() => {
    mockListSubjects.mockReturnValue([{ id: "sub1" }]);
  });

  it("returns an empty list for a blank query", () => {
    const results = searchChunks("   ");
    expect(results).toEqual([]);
  });

  it("returns an empty list when no subjects have chunks", () => {
    mockListChunks.mockReturnValue([]);
    expect(searchChunks("photosynthesis")).toEqual([]);
  });

  it("scores across subjects and ranks the best hit first", () => {
    mockListSubjects.mockReturnValue([{ id: "bio" }, { id: "hist" }]);
    mockListChunks.mockImplementation((sid: string) =>
      sid === "bio"
        ? [makeChunk("1", "Photosynthesis converts sunlight into glucose.", "bio")]
        : [makeChunk("2", "The French Revolution began in 1789.", "hist")]
    );
    const results = searchChunks("photosynthesis sunlight");
    expect(results).toHaveLength(1);
    expect(results[0].subjectId).toBe("bio");
  });

  it("carries subject/topic metadata and respects the limit", () => {
    const chunks = Array.from({ length: 10 }, (_, i) => ({
      ...makeChunk(String(i), `Photosynthesis fact ${i} about light and chlorophyll.`, "notes"),
      topicId: "t1",
    }));
    mockListChunks.mockReturnValue(chunks);
    const results = searchChunks("photosynthesis chlorophyll", 3);
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results[0].topicId).toBe("t1");
    expect(results[0].source).toBe("notes");
    expect(results[0].score).toBeGreaterThan(0);
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
