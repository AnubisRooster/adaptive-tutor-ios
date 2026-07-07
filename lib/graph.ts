/**
 * Builds a topic/prerequisite knowledge map from the student's curriculum +
 * mastery data, and serializes it to the Cytoscape.js `elements` JSON shape
 * consumed by components/KnowledgeGraphView. Pure — no React, no db import —
 * fully unit-testable, mirroring lib/subtopic-nav.ts.
 */

export type MasteryBand = "unstarted" | "learning" | "practicing" | "mastered";

export type GraphNode = {
  id: string;
  label: string;
  subjectId: string;
  band: MasteryBand;
  mastery: number;
  bloomLevel: number;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: "PREREQUISITE";
};

export type TopicGraph = { nodes: GraphNode[]; edges: GraphEdge[] };

export type GraphTopicInput = {
  id: string;
  subjectId: string;
  name: string;
  prerequisites: string; // raw JSON string, as stored in db/schema.ts topics.prerequisites
};

export type GraphMasteryInput = { mastery: number; bloomLevel: number };

export function masteryBand(mastery: number, attempted: boolean): MasteryBand {
  if (!attempted) return "unstarted";
  if (mastery >= 0.8) return "mastered";
  if (mastery >= 0.5) return "practicing";
  return "learning";
}

function parsePrerequisites(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Builds the node/edge graph from topics + per-student mastery.
 * `masteryMap` keys are topic ids; missing entries render as "unstarted".
 * Prerequisite edges pointing at a topic id outside `topics` are dropped
 * (dangling references shouldn't reach the renderer).
 */
export function buildTopicGraph(
  topics: GraphTopicInput[],
  masteryMap: Map<string, GraphMasteryInput>
): TopicGraph {
  const topicIds = new Set(topics.map((t) => t.id));

  const nodes: GraphNode[] = topics.map((t) => {
    const m = masteryMap.get(t.id);
    return {
      id: t.id,
      label: t.name,
      subjectId: t.subjectId,
      band: masteryBand(m?.mastery ?? 0, m !== undefined),
      mastery: m?.mastery ?? 0,
      bloomLevel: m?.bloomLevel ?? 1,
    };
  });

  const edges: GraphEdge[] = [];
  for (const t of topics) {
    for (const prereqId of parsePrerequisites(t.prerequisites)) {
      if (!topicIds.has(prereqId) || prereqId === t.id) continue;
      edges.push({ id: `${prereqId}->${t.id}`, source: prereqId, target: t.id, type: "PREREQUISITE" });
    }
  }

  return { nodes, edges };
}

function jsonEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

/** Serializes a TopicGraph to the Cytoscape.js `elements` JSON shape. */
export function toCytoscapeJSON(graph: TopicGraph): string {
  const nodeItems = graph.nodes.map((n) => {
    const id = jsonEscape(n.id);
    const label = jsonEscape(n.label);
    const subjectId = jsonEscape(n.subjectId);
    const band = jsonEscape(n.band);
    return `{"data":{"id":"${id}","label":"${label}","subjectId":"${subjectId}","band":"${band}","mastery":${n.mastery.toFixed(2)},"bloomLevel":${n.bloomLevel}}}`;
  });
  const edgeItems = graph.edges.map((e) => {
    const id = jsonEscape(e.id);
    const source = jsonEscape(e.source);
    const target = jsonEscape(e.target);
    const type = jsonEscape(e.type);
    return `{"data":{"id":"${id}","source":"${source}","target":"${target}","type":"${type}"}}`;
  });
  return `{"elements":{"nodes":[${nodeItems.join(",")}],"edges":[${edgeItems.join(",")}]}}`;
}
