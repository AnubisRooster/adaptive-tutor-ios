/**
 * Voice mode helpers — hands-free conversational tutoring.
 *
 * The listen → think → (optionally) speak → listen-again loop lives in the
 * voice screen; this module holds the pure text-shaping helpers plus thin
 * wrappers around expo-speech (TTS) so the screen stays focused on UI state.
 *
 * Speech-to-text uses expo-speech-recognition, which owns the AVAudioSession
 * while listening. We never listen and speak at the same time, so there is no
 * audio session conflict.
 */

import * as Speech from "expo-speech";

/**
 * Convert a tutor's markdown reply into text that reads well aloud:
 * strips code fences, URL-ish links, markdown emphasis, list markers, and
 * LaTeX delimiters/commands, and collapses whitespace.
 */
export function speechFriendly(text: string): string {
  let s = text || "";
  // Fenced code blocks → spoken as "code" summary
  s = s.replace(/```[^\n]*\n[\s\S]*?```/g, " (Here is some code.) ");
  // Inline code
  s = s.replace(/`([^`]+)`/g, "$1");
  // LaTeX display/inline delimiters
  s = s.replace(/\\\[/g, " ").replace(/\\\]/g, " ");
  s = s.replace(/\\\(/g, " ").replace(/\\\)/g, " ");
  // LaTeX commands — keep the content of \text{...} and \ce{...}, drop the rest
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname|ce)\{([^}]*)\}/g, "$1");
  s = s.replace(/\\(?:frac)\{([^}]*)\}\{([^}]*)\}/g, "$1 over $2");
  s = s.replace(/\\(?:[a-zA-Z]+)/g, " ");
  s = s.replace(/[{}^_~]/g, " ");
  // Markdown emphasis, links, headings, lists
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/^\s*>+\s?/gm, "");
  // List items become sentence breaks so the reply reads naturally aloud.
  s = s.replace(/^\s*[-*+]\s+/gm, ". ");
  s = s.replace(/^\s*\d+\.\s+/gm, ". ");
  // Bullet dots
  s = s.replace(/•/g, ". ");
  // Empty markdown links that only expose the URL
  s = s.replace(/https?:\/\/[^\s)]+/g, " ");
  // Tidy the sentence-break dots inserted for list items
  s = s.replace(/\s*\.\s+/g, ". ").replace(/^\.\s*/, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Speak a reply aloud. Resolves when speaking finishes or an error occurs. */
export async function speakText(text: string): Promise<void> {
  const message = speechFriendly(text);
  if (!message.trim()) return;
  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    Speech.speak(message, {
      language: "en-US",
      rate: 0.95,
      onDone: finish,
      onStopped: finish,
      onError: finish,
    });
    // Safety net so a missing pronunciation callback never hangs the loop.
    const timer = setTimeout(finish, 60_000);
  });
}

/** Interrupt any in-flight speech (returns a promise, per expo-speech API). */
export function stopSpeaking(): Promise<void> {
  return Speech.stop();
}