import {
  curriculumMessages,
  parseCurriculumDraft,
} from "@/lib/curriculum-gen";

jest.mock("@/lib/llm", () => ({
  chatOnce: jest.fn(),
}));

const VALID_DRAFT = {
  subject: {
    name: "Biology",
    description: "The study of living organisms.",
    framing: "Connect concepts to everyday life.",
  },
  topics: [
    {
      name: "Cell Theory",
      description: "Foundational principles of the cell.",
      prerequisiteIndexes: [],
    },
    {
      name: "Cell Division",
      description: "Mitosis and meiosis explained.",
      prerequisiteIndexes: [0],
    },
    {
      name: "Genetics",
      description: "Inheritance and gene expression.",
      prerequisiteIndexes: [0, 1],
    },
  ],
};

describe("curriculumMessages", () => {
  it("builds a two-message array (system + user)", () => {
    const msgs = curriculumMessages({ subjectName: "Biology" });
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("system");
    expect(msgs[1].role).toBe("user");
  });

  it("includes the subject name in the user message", () => {
    const msgs = curriculumMessages({ subjectName: "Chemistry" });
    expect(msgs[1].content).toContain("Chemistry");
  });

  it("includes a truncated sample text when provided", () => {
    const sampleText = "Sample content about biology.";
    const msgs = curriculumMessages({ subjectName: "Biology", sampleText });
    expect(msgs[1].content).toContain("Sample content about biology.");
  });

  it("does not include sample text block when sampleText is absent", () => {
    const msgs = curriculumMessages({ subjectName: "Biology" });
    expect(msgs[1].content).not.toContain('"""');
  });
});

describe("parseCurriculumDraft", () => {
  it("parses a valid draft and returns a CurriculumDraft", () => {
    const draft = parseCurriculumDraft(JSON.stringify(VALID_DRAFT));
    expect(draft.subject.name).toBe("Biology");
    expect(draft.topics).toHaveLength(3);
  });

  it("strips forward-referencing prerequisite indexes", () => {
    const invalid = {
      ...VALID_DRAFT,
      topics: [
        { name: "A", description: "First.", prerequisiteIndexes: [1] }, // invalid: 1 > 0
        { name: "B", description: "Second.", prerequisiteIndexes: [0] }, // valid
      ],
    };
    const draft = parseCurriculumDraft(JSON.stringify(invalid));
    expect(draft.topics[0].prerequisiteIndexes).toEqual([]);
    expect(draft.topics[1].prerequisiteIndexes).toEqual([0]);
  });

  it("deduplicates prerequisite indexes", () => {
    const dup = {
      ...VALID_DRAFT,
      topics: [
        { name: "A", description: "d1.", prerequisiteIndexes: [] },
        { name: "B", description: "d2.", prerequisiteIndexes: [0, 0] },
      ],
    };
    const draft = parseCurriculumDraft(JSON.stringify(dup));
    expect(draft.topics[1].prerequisiteIndexes).toEqual([0]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseCurriculumDraft("not json")).toThrow();
  });

  it("throws when the schema does not match", () => {
    expect(() =>
      parseCurriculumDraft(JSON.stringify({ wrong: "shape" }))
    ).toThrow("unexpected curriculum format");
  });
});
