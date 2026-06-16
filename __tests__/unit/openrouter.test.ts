import { fetch as expoFetch } from "expo/fetch";
import {
  normalizeModel,
  rankModels,
  openrouterChatOnce,
  validateApiKey,
} from "@/lib/openrouter";

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));

const mockFetch = expoFetch as jest.Mock;

beforeEach(() => {
  mockFetch.mockReset();
});

// ---------- normalizeModel ----------

describe("normalizeModel", () => {
  it("marks a model as free when both prices are '0'", () => {
    const m = normalizeModel({
      id: "vendor/model-free",
      name: "Free Model",
      context_length: 8192,
      pricing: { prompt: "0", completion: "0" },
    });
    expect(m.isFree).toBe(true);
    expect(m.promptPricePer1M).toBe(0);
    expect(m.completionPricePer1M).toBe(0);
  });

  it("marks a model as free when pricing is absent", () => {
    const m = normalizeModel({ id: "vendor/no-price" });
    expect(m.isFree).toBe(true);
  });

  it("marks a paid model correctly and converts per-token to per-1M", () => {
    const m = normalizeModel({
      id: "vendor/paid",
      name: "Paid Model",
      context_length: 128_000,
      pricing: { prompt: "0.000001", completion: "0.000003" },
    });
    expect(m.isFree).toBe(false);
    expect(m.completionPricePer1M).toBeCloseTo(3.0);
    expect(m.promptPricePer1M).toBeCloseTo(1.0);
    expect(m.contextLength).toBe(128_000);
  });

  it("uses the id as name when name is absent", () => {
    const m = normalizeModel({ id: "vendor/nameless" });
    expect(m.name).toBe("vendor/nameless");
  });
});

// ---------- rankModels ----------

describe("rankModels", () => {
  const free1 = normalizeModel({
    id: "a/free-small",
    context_length: 4096,
    pricing: { prompt: "0", completion: "0" },
  });
  const free2 = normalizeModel({
    id: "a/free-large",
    context_length: 128_000,
    pricing: { prompt: "0", completion: "0" },
  });
  const cheap = normalizeModel({
    id: "a/cheap",
    context_length: 8192,
    pricing: { prompt: "0.0000005", completion: "0.000001" },
  });
  const expensive = normalizeModel({
    id: "a/expensive",
    context_length: 8192,
    pricing: { prompt: "0.000003", completion: "0.000006" },
  });

  it("puts free models before paid", () => {
    const ranked = rankModels([cheap, free1, expensive]);
    expect(ranked[0].isFree).toBe(true);
    expect(ranked[1].isFree).toBe(false);
  });

  it("within free models, orders by context length descending", () => {
    const ranked = rankModels([free1, free2]);
    expect(ranked[0].id).toBe("a/free-large");
    expect(ranked[1].id).toBe("a/free-small");
  });

  it("within paid models, orders by completion price ascending", () => {
    const ranked = rankModels([expensive, cheap]);
    expect(ranked[0].id).toBe("a/cheap");
    expect(ranked[1].id).toBe("a/expensive");
  });

  it("does not mutate the input array", () => {
    const original = [cheap, free1];
    rankModels(original);
    expect(original[0].id).toBe("a/cheap");
  });
});

// ---------- validateApiKey ----------

describe("validateApiKey", () => {
  it("returns true when the server responds ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await expect(validateApiKey("sk-or-good")).resolves.toBe(true);
  });

  it("returns false when the server rejects the key", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(validateApiKey("sk-or-bad")).resolves.toBe(false);
  });

  it("returns false when fetch throws (network error)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    await expect(validateApiKey("sk-or-anything")).resolves.toBe(false);
  });
});

// ---------- openrouterChatOnce ----------

describe("openrouterChatOnce", () => {
  const MESSAGES = [{ role: "user" as const, content: "Hello" }];

  it("returns the model's reply content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hello, world!" } }],
      }),
    });
    const result = await openrouterChatOnce("sk-or-key", "gpt-4o-mini", MESSAGES);
    expect(result).toBe("Hello, world!");
  });

  it("returns empty string when choices is empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    });
    const result = await openrouterChatOnce("sk-or-key", "gpt-4o-mini", MESSAGES);
    expect(result).toBe("");
  });

  it("throws on HTTP error with status code in message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    });
    await expect(
      openrouterChatOnce("sk-or-key", "gpt-4o-mini", MESSAGES)
    ).rejects.toThrow("429");
  });
});
