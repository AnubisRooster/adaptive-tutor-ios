import { speechFriendly, speakText, stopSpeaking } from "@/lib/voice";
import * as Speech from "expo-speech";

jest.mock("expo-speech", () => ({
  speak: jest.fn((_text: string, opts?: { onDone?: () => void }) => {
    opts?.onDone?.();
  }),
  stop: jest.fn().mockResolvedValue(undefined),
}));

const mockSpeak = Speech.speak as jest.Mock;
const mockStop = Speech.stop as jest.Mock;

beforeEach(() => {
  mockSpeak.mockClear();
  mockStop.mockClear();
});

describe("speechFriendly", () => {
  it("strips markdown emphasis, links, and headings", () => {
    const out = speechFriendly("# Photosynthesis\n\n**Light** and *water* are key. See [notes](https://x.io).");
    expect(out).toContain("Photosynthesis");
    expect(out).toContain("Light and water are key");
    expect(out).toContain("See notes");
    expect(out).not.toContain("https://x.io");
  });

  it("collapses lists into plain sentences", () => {
    const out = speechFriendly("- First point\n- Second point\n\n1. Third");
    expect(out).toBe("First point. Second point. Third");
  });

  it("strips LaTeX delimiters and commands", () => {
    const out = speechFriendly("Solving \\( x^2 = 4 \\) gives \\[ x = \\pm 2 \\] and \\(\\ce{H2O}\\).");
    expect(out).not.toContain("\\(");
    expect(out).not.toContain("\\[");
    expect(out).toContain("x 2 = 4");
    expect(out).toContain("H2O");
  });

  it("turns code fences into a spoken placeholder", () => {
    const out = speechFriendly("Do this:\n```js\nlet x = 1;\n```\nOK?");
    expect(out).toContain("Here is some code");
    expect(out).not.toContain("let x = 1");
  });

  it("collapses whitespace", () => {
    expect(speechFriendly("  a   b\n\n\n  c  ")).toBe("a b c");
  });
});

describe("speakText", () => {
  it("speaks the sanitized text and resolves on done", async () => {
    await speakText("**Hello**, world!");
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const [text, opts] = mockSpeak.mock.calls[0];
    expect(text).toBe("Hello, world!");
    expect(opts.language).toBe("en-US");
  });

  it("does nothing for empty text", async () => {
    await speakText("");
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});

describe("stopSpeaking", () => {
  it("delegates to Speech.stop", async () => {
    await stopSpeaking();
    expect(mockStop).toHaveBeenCalled();
  });
});