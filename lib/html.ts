export async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AdaptiveTutor/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const html = await res.text();
  return extractText(html);
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
