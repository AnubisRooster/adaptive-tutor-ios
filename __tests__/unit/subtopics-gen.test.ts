import { parseStructuredJson } from "@/lib/subtopics-gen";

jest.mock("@/lib/llm", () => ({ chatOnce: jest.fn() }));
jest.mock("@/lib/data", () => ({
  getTopic: jest.fn(),
  getSubject: jest.fn(),
  getTopicSubtopics: jest.fn(),
  setTopicSubtopics: jest.fn(),
}));
jest.mock("@/lib/rag", () => ({
  retrieveContext: jest.fn().mockResolvedValue([]),
  contextBlock: jest.fn().mockReturnValue(""),
}));

describe("parseStructuredJson", () => {
  it("parses clean JSON directly", () => {
    const result = parseStructuredJson('{"key": "value"}');
    expect(result).toEqual({ key: "value" });
  });

  it("strips markdown code fences and parses the inner JSON", () => {
    const result = parseStructuredJson('```json\n{"foo": 1}\n```');
    expect(result).toEqual({ foo: 1 });
  });

  it("strips a plain code fence with no language tag", () => {
    const result = parseStructuredJson('```\n{"bar": true}\n```');
    expect(result).toEqual({ bar: true });
  });

  it("extracts the first JSON object when there is surrounding text", () => {
    const result = parseStructuredJson(
      'Here is the JSON:\n\n{"answer": 42}\n\nEnd.'
    );
    expect(result).toEqual({ answer: 42 });
  });

  it("extracts JSON from inside code fences that also have surrounding text", () => {
    const result = parseStructuredJson(
      "Sure thing!\n```json\n{\"x\": \"y\"}\n```\nDone."
    );
    expect(result).toEqual({ x: "y" });
  });

  it("handles nested JSON objects", () => {
    const nested = { outer: { inner: [1, 2, 3] } };
    const result = parseStructuredJson(JSON.stringify(nested));
    expect(result).toEqual(nested);
  });

  it("throws when no valid JSON object can be found", () => {
    expect(() => parseStructuredJson("no json here at all")).toThrow(
      "invalid JSON"
    );
  });

  it("throws when braces are unbalanced", () => {
    expect(() => parseStructuredJson("{ unterminated")).toThrow();
  });
});
