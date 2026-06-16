import { extractText, fetchPageText, assertSafeUrl } from "@/lib/html";

describe("extractText", () => {
  it("strips script tags and their content", () => {
    const html = "<p>Hello</p><script>alert('xss')</script><p>World</p>";
    const text = extractText(html);
    expect(text).not.toContain("alert");
    expect(text).toContain("Hello");
    expect(text).toContain("World");
  });

  it("strips style tags and their content", () => {
    const html = "<p>Content</p><style>.red { color: red; }</style>";
    const text = extractText(html);
    expect(text).not.toContain("color: red");
    expect(text).toContain("Content");
  });

  it("decodes common HTML entities", () => {
    const html = "<p>AT&amp;T &lt;rocks&gt; &quot;quotes&quot; &#39;apos&#39;</p>";
    const text = extractText(html);
    expect(text).toContain("AT&T");
    expect(text).toContain("<rocks>");
    expect(text).toContain('"quotes"');
    expect(text).toContain("'apos'");
  });

  it("converts block elements to newlines", () => {
    const html = "<p>Para one</p><p>Para two</p><h1>Title</h1>";
    const text = extractText(html);
    expect(text).toContain("Para one");
    expect(text).toContain("Para two");
    expect(text).toContain("Title");
    const lines = text.split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("strips remaining HTML tags leaving only text", () => {
    const html = '<a href="https://example.com"><strong>Link text</strong></a>';
    const text = extractText(html);
    expect(text).not.toContain("<a");
    expect(text).not.toContain("<strong");
    expect(text).toContain("Link text");
  });
});

describe("fetchPageText", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("fetches the URL and returns extracted text", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      text: async () => "<p>Hello <strong>world</strong></p>",
    } as unknown as Response);
    const text = await fetchPageText("https://example.com");
    expect(text).toContain("Hello");
    expect(text).toContain("world");
  });

  it("throws on HTTP error response", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 404 } as unknown as Response);
    await expect(fetchPageText("https://example.com/404")).rejects.toThrow("HTTP 404");
  });

  it("rejects non-http(s) schemes without fetching", async () => {
    await expect(fetchPageText("file:///etc/passwd")).rejects.toThrow(/http and https/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects loopback and private-network hosts without fetching", async () => {
    await expect(fetchPageText("http://localhost:8080/admin")).rejects.toThrow(/private-network/);
    await expect(fetchPageText("http://127.0.0.1/")).rejects.toThrow(/private-network/);
    await expect(fetchPageText("http://192.168.1.1/")).rejects.toThrow(/private-network/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("assertSafeUrl", () => {
  it("accepts ordinary http and https URLs", () => {
    expect(assertSafeUrl("https://example.com/page").hostname).toBe("example.com");
    expect(assertSafeUrl("http://news.example.org").protocol).toBe("http:");
  });

  it("throws on malformed input", () => {
    expect(() => assertSafeUrl("not a url")).toThrow(/valid URL/);
  });

  it("blocks link-local metadata-style addresses", () => {
    expect(() => assertSafeUrl("http://169.254.169.254/latest/meta-data")).toThrow(
      /private-network/
    );
  });
});
