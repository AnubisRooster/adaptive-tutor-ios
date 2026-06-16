import type { Student } from "@/db/schema";
import { resolveLlmConfig, resolveLlmConfigById } from "@/lib/llm";
import { getApiKey } from "@/lib/key-store";
import { getStudent } from "@/lib/data";

jest.mock("@/lib/key-store", () => ({ getApiKey: jest.fn() }));
jest.mock("@/lib/data", () => ({ getStudent: jest.fn() }));
jest.mock("@/lib/openrouter", () => ({
  openrouterChatStream: jest.fn(),
  openrouterChatOnce: jest.fn(),
}));

const mockGetApiKey = getApiKey as jest.Mock;
const mockGetStudent = getStudent as jest.Mock;

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: "test-id",
    name: "Test",
    color: "#6366f1",
    pinHash: null,
    isAdmin: false,
    pacePref: "normal",
    tonePref: "encouraging",
    themePref: "system",
    llmProvider: "openrouter",
    openrouterModel: null,
    xp: 0,
    streakCount: 0,
    streakLastDay: null,
    shareStats: false,
    createdAt: 0,
    lastActiveAt: 0,
    ...overrides,
  } as Student;
}

beforeEach(() => {
  mockGetApiKey.mockReset();
  mockGetStudent.mockReset();
});

describe("resolveLlmConfig", () => {
  it("throws when no API key is stored in the keychain", async () => {
    mockGetApiKey.mockResolvedValueOnce(null);
    await expect(resolveLlmConfig(makeStudent())).rejects.toThrow(
      "No OpenRouter API key found"
    );
  });

  it("resolves with the stored key and default model", async () => {
    mockGetApiKey.mockResolvedValueOnce("sk-or-test");
    const cfg = await resolveLlmConfig(makeStudent({ openrouterModel: null }));
    expect(cfg.provider).toBe("openrouter");
    expect(cfg.apiKey).toBe("sk-or-test");
    expect(cfg.model).toBe("google/gemma-3-27b-it:free");
  });

  it("resolves with the student's chosen model when set", async () => {
    mockGetApiKey.mockResolvedValueOnce("sk-or-test");
    const cfg = await resolveLlmConfig(
      makeStudent({ openrouterModel: "anthropic/claude-haiku-4-5" })
    );
    expect(cfg.model).toBe("anthropic/claude-haiku-4-5");
  });

  it("calls getApiKey with the student's id", async () => {
    mockGetApiKey.mockResolvedValueOnce("sk-or-test");
    await resolveLlmConfig(makeStudent({ id: "stu-xyz" }));
    expect(mockGetApiKey).toHaveBeenCalledWith("stu-xyz");
  });
});

describe("resolveLlmConfigById", () => {
  it("throws when the student is not found", async () => {
    mockGetStudent.mockReturnValueOnce(undefined);
    await expect(resolveLlmConfigById("unknown-id")).rejects.toThrow(
      "unknown-id"
    );
  });

  it("resolves config for an existing student", async () => {
    mockGetStudent.mockReturnValueOnce(makeStudent({ id: "stu-1" }));
    mockGetApiKey.mockResolvedValueOnce("sk-or-key");
    const cfg = await resolveLlmConfigById("stu-1");
    expect(cfg.provider).toBe("openrouter");
    expect(cfg.apiKey).toBe("sk-or-key");
  });
});
