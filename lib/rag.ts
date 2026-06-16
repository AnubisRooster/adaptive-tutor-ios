import { listChunks } from "@/lib/data";

export type RetrievedChunk = {
  text: string;
  source: string;
  score: number;
};

const BM25_K1 = 1.2;
const BM25_B = 0.75;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function scoreBm25(
  queryTerms: string[],
  docFreq: Record<string, number>,
  termFreq: Record<string, number>,
  docLen: number,
  avgDocLen: number,
  corpusSize: number
): number {
  let score = 0;
  for (const term of queryTerms) {
    const tf = termFreq[term] ?? 0;
    if (tf === 0) continue;
    const df = docFreq[term] ?? 0;
    const idf = Math.log((corpusSize - df + 0.5) / (df + 0.5) + 1);
    const norm = BM25_K1 * (1 - BM25_B + BM25_B * (docLen / avgDocLen));
    score += idf * (tf * (BM25_K1 + 1)) / (tf + norm);
  }
  return score;
}

/** Retrieve the top-k chunks relevant to a query for a given subject/topic using BM25. */
export async function retrieveContext(
  subjectId: string,
  _topicId: string | undefined,
  query: string,
  limit = 4
): Promise<RetrievedChunk[]> {
  if (!query.trim()) return [];
  const chunks = listChunks(subjectId);
  if (chunks.length === 0) return [];

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const tokenized = chunks.map((c) => tokenize(c.text));
  const totalLen = tokenized.reduce((s, t) => s + t.length, 0);
  const avgDocLen = totalLen / tokenized.length;

  const docFreq: Record<string, number> = {};
  for (const docTerms of tokenized) {
    const seen = new Set(docTerms);
    for (const qt of queryTerms) {
      if (seen.has(qt)) docFreq[qt] = (docFreq[qt] ?? 0) + 1;
    }
  }

  const scored = chunks.map((chunk, i) => {
    const terms = tokenized[i];
    const termFreq: Record<string, number> = {};
    for (const t of terms) termFreq[t] = (termFreq[t] ?? 0) + 1;
    const score = scoreBm25(queryTerms, docFreq, termFreq, terms.length, avgDocLen, chunks.length);
    return { score, chunk };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, chunk }) => ({
      text: chunk.text,
      source: chunk.source,
      score,
    }));
}

/** Format retrieved chunks into a compact reference block for the prompt. */
export function contextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c, i) => `[${i + 1}] ${c.text.trim()}`)
    .join("\n\n");
}
