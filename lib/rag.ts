/**
 * On-device lexical retrieval (RAG).
 * Phase 2 stub — returns empty context so the rest of the pipeline compiles.
 * Phase 5 replaces this with a real BM25/keyword implementation over
 * knowledge_chunks stored in SQLite.
 */

export type RetrievedChunk = {
  text: string;
  source: string;
  score: number;
};

/** Retrieve the top-k chunks relevant to a query for a given subject/topic. */
export async function retrieveContext(
  _subjectId: string,
  _topicId: string | undefined,
  _query: string,
  _limit = 4
): Promise<RetrievedChunk[]> {
  return [];
}

/** Format retrieved chunks into a compact reference block for the prompt. */
export function contextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c, i) => `[${i + 1}] ${c.text.trim()}`)
    .join("\n\n");
}
