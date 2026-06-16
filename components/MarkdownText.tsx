import React from "react";
import { Text, View, StyleSheet } from "react-native";

type Segment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string };

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  // Pattern: **bold**, *italic*, `code` (in that priority order)
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/gs;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ type: "text", value: text.slice(last, m.index) });
    }
    if (m[2] !== undefined) {
      segments.push({ type: "bold", value: m[2] });
    } else if (m[3] !== undefined) {
      segments.push({ type: "italic", value: m[3] });
    } else if (m[4] !== undefined) {
      segments.push({ type: "code", value: m[4] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push({ type: "text", value: text.slice(last) });
  }
  return segments;
}

function InlineText({ segments, style }: { segments: Segment[]; style?: object }) {
  return (
    <Text style={style}>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "bold":
            return <Text key={i} style={styles.bold}>{seg.value}</Text>;
          case "italic":
            return <Text key={i} style={styles.italic}>{seg.value}</Text>;
          case "code":
            return <Text key={i} style={styles.inlineCode}>{seg.value}</Text>;
          default:
            return <Text key={i}>{seg.value}</Text>;
        }
      })}
    </Text>
  );
}

type BlockToken =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "hr" }
  | { type: "codeBlock"; lang: string; text: string }
  | { type: "bullet"; text: string }
  | { type: "paragraph"; text: string };

function tokenize(markdown: string): BlockToken[] {
  const tokens: BlockToken[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: "codeBlock", lang, text: codeLines.join("\n") });
      i++;
      continue;
    }

    // Headings
    if (/^### /.test(line)) {
      tokens.push({ type: "h3", text: line.slice(4) });
      i++;
      continue;
    }
    if (/^## /.test(line)) {
      tokens.push({ type: "h2", text: line.slice(3) });
      i++;
      continue;
    }
    if (/^# /.test(line)) {
      tokens.push({ type: "h1", text: line.slice(2) });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      tokens.push({ type: "hr" });
      i++;
      continue;
    }

    // Bullet list item
    if (/^[-*] /.test(line)) {
      tokens.push({ type: "bullet", text: line.slice(2) });
      i++;
      continue;
    }

    // Numbered list item — treat same as bullet
    if (/^\d+\. /.test(line)) {
      tokens.push({ type: "bullet", text: line.replace(/^\d+\. /, "") });
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — accumulate consecutive non-blank, non-special lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3} |```|---+$|[-*] |\d+\. )/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length > 0) {
      tokens.push({ type: "paragraph", text: para.join(" ") });
    }
  }

  return tokens;
}

export interface MarkdownTextProps {
  content: string;
  /** Base text color. Defaults to inherit (dark or light based on platform). */
  color?: string;
  style?: object;
}

export default function MarkdownText({ content, color, style }: MarkdownTextProps) {
  const tokens = tokenize(content || "");
  const textColor = color ? { color } : undefined;

  return (
    <View style={style}>
      {tokens.map((tok, i) => {
        switch (tok.type) {
          case "h1":
            return (
              <InlineText
                key={i}
                segments={parseInline(tok.text)}
                style={[styles.h1, textColor]}
              />
            );
          case "h2":
            return (
              <InlineText
                key={i}
                segments={parseInline(tok.text)}
                style={[styles.h2, textColor]}
              />
            );
          case "h3":
            return (
              <InlineText
                key={i}
                segments={parseInline(tok.text)}
                style={[styles.h3, textColor]}
              />
            );
          case "hr":
            return <View key={i} style={styles.hr} />;
          case "codeBlock":
            return (
              <View key={i} style={styles.codeBlock}>
                <Text style={styles.codeBlockText}>{tok.text}</Text>
              </View>
            );
          case "bullet":
            return (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, textColor]}>{"•"}</Text>
                <InlineText
                  segments={parseInline(tok.text)}
                  style={[styles.bulletText, textColor]}
                />
              </View>
            );
          default:
            return (
              <InlineText
                key={i}
                segments={parseInline(tok.text)}
                style={[styles.paragraph, textColor]}
              />
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 6, marginTop: 4 },
  h2: { fontSize: 17, fontWeight: "700", marginBottom: 4, marginTop: 4 },
  h3: { fontSize: 15, fontWeight: "600", marginBottom: 4, marginTop: 4 },
  paragraph: { fontSize: 14, lineHeight: 21, marginBottom: 6 },
  bold: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: 13,
    backgroundColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  codeBlock: {
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  codeBlockText: { fontFamily: "monospace", fontSize: 13, lineHeight: 19 },
  hr: { height: 1, backgroundColor: "rgba(0,0,0,0.12)", marginVertical: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
  bulletDot: { fontSize: 14, lineHeight: 21, marginRight: 6, marginTop: 0 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21 },
});
