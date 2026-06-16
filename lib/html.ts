// Cap how much we read from a remote page so a malicious/huge response can't
// exhaust device memory. ~5 MB of HTML is far more than any article needs.
const MAX_BYTES = 5 * 1024 * 1024;
// Abort slow connections rather than hanging the ingestion UI forever.
const FETCH_TIMEOUT_MS = 20_000;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./, // link-local
  /^::1$/,
  /^fe80:/i, // IPv6 link-local
  /^f[cd][0-9a-f]{2}:/i, // IPv6 unique-local
];

/**
 * Validate a user-supplied ingestion URL. Only http(s) is allowed, and we
 * reject loopback / private-network hosts to avoid SSRF against the device's
 * local network or services bound to localhost.
 */
export function assertSafeUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs can be ingested.");
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  if (PRIVATE_HOST_PATTERNS.some((re) => re.test(host))) {
    throw new Error("Local and private-network addresses can't be ingested.");
  }
  return parsed;
}

export async function fetchPageText(url: string): Promise<string> {
  const safe = assertSafeUrl(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(safe.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AdaptiveTutor/1.0)" },
      signal: controller.signal,
      redirect: "follow",
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Timed out fetching that page.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  const html = await res.text();
  // Defensively cap size after reading (some platforms don't expose a
  // streaming reader for the global fetch body).
  return extractText(html.length > MAX_BYTES ? html.slice(0, MAX_BYTES) : html);
}

export function extractText(html: string): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(header|nav|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, " ");

  text = text
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  text = text.replace(/<[^>]+>/g, " ");

  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)));

  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}
