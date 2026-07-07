import {
  buildTopicGraph,
  toCytoscapeJSON,
  masteryBand,
  type GraphTopicInput,
  type GraphMasteryInput,
} from "@/lib/graph";

function topic(overrides: Partial<GraphTopicInput> = {}): GraphTopicInput {
  return {
    id: "t1",
    subjectId: "math",
    name: "Topic 1",
    prerequisites: "[]",
    ...overrides,
  };
}

describe("masteryBand", () => {
  it("returns unstarted when not attempted, regardless of mastery value", () => {
    expect(masteryBand(0.9, false)).toBe("unstarted");
  });

  it("returns learning below 0.5", () => {
    expect(masteryBand(0.2, true)).toBe("learning");
  });

  it("returns practicing between 0.5 and 0.8", () => {
    expect(masteryBand(0.6, true)).toBe("practicing");
  });

  it("returns mastered at or above 0.8", () => {
    expect(masteryBand(0.8, true)).toBe("mastered");
    expect(masteryBand(1, true)).toBe("mastered");
  });
});

describe("buildTopicGraph", () => {
  it("builds one node per topic, defaulting to unstarted with no mastery entry", () => {
    const graph = buildTopicGraph([topic()], new Map());
    expect(graph.nodes).toEqual([
      { id: "t1", label: "Topic 1", subjectId: "math", band: "unstarted", mastery: 0, bloomLevel: 1 },
    ]);
    expect(graph.edges).toEqual([]);
  });

  it("reflects mastery + bloom level from the mastery map", () => {
    const masteryMap = new Map<string, GraphMasteryInput>([["t1", { mastery: 0.9, bloomLevel: 3 }]]);
    const graph = buildTopicGraph([topic()], masteryMap);
    expect(graph.nodes[0]).toMatchObject({ band: "mastered", mastery: 0.9, bloomLevel: 3 });
  });

  it("wires a prerequisite edge from the prerequisite topic to the dependent topic", () => {
    const topics = [
      topic({ id: "t1", name: "Basics" }),
      topic({ id: "t2", name: "Advanced", prerequisites: '["t1"]' }),
    ];
    const graph = buildTopicGraph(topics, new Map());
    expect(graph.edges).toEqual([{ id: "t1->t2", source: "t1", target: "t2", type: "PREREQUISITE" }]);
  });

  it("drops a prerequisite edge pointing at a topic id that isn't in the list", () => {
    const topics = [topic({ id: "t2", prerequisites: '["missing"]' })];
    const graph = buildTopicGraph(topics, new Map());
    expect(graph.edges).toEqual([]);
  });

  it("drops a self-referencing prerequisite", () => {
    const topics = [topic({ id: "t1", prerequisites: '["t1"]' })];
    const graph = buildTopicGraph(topics, new Map());
    expect(graph.edges).toEqual([]);
  });

  it("tolerates malformed prerequisites JSON", () => {
    const topics = [topic({ prerequisites: "not json" })];
    expect(() => buildTopicGraph(topics, new Map())).not.toThrow();
    expect(buildTopicGraph(topics, new Map()).edges).toEqual([]);
  });
});

describe("toCytoscapeJSON", () => {
  it("serializes nodes and edges into the cytoscape elements shape", () => {
    const graph = buildTopicGraph(
      [topic({ id: "t1" }), topic({ id: "t2", prerequisites: '["t1"]' })],
      new Map()
    );
    const parsed = JSON.parse(toCytoscapeJSON(graph));
    expect(parsed.elements.nodes).toHaveLength(2);
    expect(parsed.elements.edges).toHaveLength(1);
    expect(parsed.elements.nodes[0].data.id).toBe("t1");
    expect(parsed.elements.edges[0].data).toMatchObject({ source: "t1", target: "t2", type: "PREREQUISITE" });
  });

  it("escapes quotes and backslashes in labels so the JSON stays valid", () => {
    const graph = buildTopicGraph([topic({ id: "t1", name: 'Say "hi"\\there' })], new Map());
    const parsed = JSON.parse(toCytoscapeJSON(graph));
    expect(parsed.elements.nodes[0].data.label).toBe('Say "hi"\\there');
  });

  it("produces valid JSON for an empty graph", () => {
    const parsed = JSON.parse(toCytoscapeJSON({ nodes: [], edges: [] }));
    expect(parsed).toEqual({ elements: { nodes: [], edges: [] } });
  });
});
