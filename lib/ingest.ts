import { createSource, updateSource, insertKnowledgeChunk } from "@/lib/data";
import { fetchPageText } from "@/lib/html";
import { chunkText } from "@/lib/chunk";

export type IngestProgress =
  | { phase: "fetching" }
  | { phase: "chunking" }
  | { phase: "saving"; total: number; saved: number }
  | { phase: "done"; chunkCount: number };

export async function ingestUrl(
  url: string,
  subjectId: string,
  topicId: string | null,
  onProgress?: (p: IngestProgress) => void
): Promise<{ sourceId: string; chunkCount: number }> {
  onProgress?.({ phase: "fetching" });
  const text = await fetchPageText(url);

  onProgress?.({ phase: "chunking" });
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    throw new Error("No text content found at that URL.");
  }

  const source = createSource({ subjectId, topicId, kind: "url", name: url });

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.({ phase: "saving", total: chunks.length, saved: i });
    insertKnowledgeChunk({
      subjectId,
      topicId,
      source: url,
      sourceId: source.id,
      text: chunks[i],
    });
  }

  updateSource(source.id, { status: "ready", chunkCount: chunks.length });
  onProgress?.({ phase: "done", chunkCount: chunks.length });
  return { sourceId: source.id, chunkCount: chunks.length };
}
