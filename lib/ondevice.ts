/**
 * On-device LLM provider using llama.rn (llama.cpp + Metal GPU backend).
 *
 * Responsibilities:
 *   - Maintain a catalog of GGUF models sized for the A18 / 8 GB envelope.
 *   - Download GGUF files to the expo-file-system document directory.
 *   - Load / unload a single llama.cpp context (one active at a time).
 *   - Stream completions as an AsyncGenerator, token by token.
 */

import * as FileSystem from "expo-file-system/legacy";
import {
  initLlama,
  releaseAllLlama,
  type LlamaContext,
  type TokenData,
} from "llama.rn";
import type { LlmMessage } from "@/lib/llm";

// ---------- Model catalog ----------

export type OnDeviceModel = {
  id: string;
  name: string;
  description: string;
  /** Approximate on-disk size for display purposes. */
  sizeBytes: number;
  /** Public GGUF download URL (Hugging Face bartowski quantizations). */
  url: string;
  recommended: boolean;
};

export const ON_DEVICE_MODELS: OnDeviceModel[] = [
  {
    id: "llama-3.2-1b-q4",
    name: "Llama 3.2 1B (Q4_K_M)",
    description: "Fastest — good for straightforward tutoring. ~700 MB.",
    sizeBytes: 735_000_000,
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    recommended: false,
  },
  {
    id: "llama-3.2-3b-q4",
    name: "Llama 3.2 3B (Q4_K_M)",
    description: "Best balance of speed and quality on A18. ~1.9 GB.",
    sizeBytes: 1_920_000_000,
    url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    recommended: true,
  },
  {
    id: "phi-3.5-mini-q4",
    name: "Phi-3.5-Mini 3.8B (Q4_K_M)",
    description: "Strong reasoning and math. ~2.2 GB.",
    sizeBytes: 2_200_000_000,
    url: "https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf",
    recommended: false,
  },
];

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return (bytes / 1_000_000_000).toFixed(1) + " GB";
  return (bytes / 1_000_000).toFixed(0) + " MB";
}

// ---------- File system helpers ----------

const MODELS_DIR = FileSystem.documentDirectory + "models/";

export function modelFilePath(modelId: string): string {
  return MODELS_DIR + modelId + ".gguf";
}

async function ensureModelsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODELS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
  }
}

export async function isModelDownloaded(modelId: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(modelFilePath(modelId));
  return info.exists && !info.isDirectory;
}

export async function deleteModel(modelId: string): Promise<void> {
  const path = modelFilePath(modelId);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) await FileSystem.deleteAsync(path, { idempotent: true });
}

// ---------- Download ----------

export type DownloadProgress = {
  bytesWritten: number;
  totalBytes: number;
  /** 0–1, or -1 if total is unknown. */
  fraction: number;
};

export type ActiveDownload = {
  modelId: string;
  cancel: () => Promise<void>;
};

// Track the current in-progress download so the Settings UI can show one cancel button.
let _activeDownload: ActiveDownload | null = null;

export function getActiveDownload(): ActiveDownload | null {
  return _activeDownload;
}

/**
 * Download a GGUF model to the documents directory.
 * Only one download runs at a time; calling this while another is in progress throws.
 */
export async function downloadModel(
  modelId: string,
  onProgress: (p: DownloadProgress) => void
): Promise<string> {
  if (_activeDownload) {
    throw new Error(`Another model (${_activeDownload.modelId}) is already downloading.`);
  }

  const model = ON_DEVICE_MODELS.find((m) => m.id === modelId);
  if (!model) throw new Error(`Unknown on-device model: ${modelId}`);

  await ensureModelsDir();

  const dest = modelFilePath(modelId);
  const dl = FileSystem.createDownloadResumable(
    model.url,
    dest,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const known = totalBytesExpectedToWrite > 0;
      onProgress({
        bytesWritten: totalBytesWritten,
        totalBytes: known ? totalBytesExpectedToWrite : model.sizeBytes,
        fraction: known
          ? totalBytesWritten / totalBytesExpectedToWrite
          : totalBytesWritten / model.sizeBytes,
      });
    }
  );

  _activeDownload = {
    modelId,
    cancel: async () => {
      await dl.cancelAsync();
      // Remove the partial file so it doesn't appear as downloaded.
      await FileSystem.deleteAsync(dest, { idempotent: true });
      _activeDownload = null;
    },
  };

  try {
    const result = await dl.downloadAsync();
    if (!result?.uri) throw new Error("Download completed but returned no URI.");
    return result.uri;
  } finally {
    _activeDownload = null;
  }
}

// ---------- Inference context ----------

let _ctx: LlamaContext | null = null;
let _loadedModelId: string | null = null;

/**
 * Load a GGUF model into memory, offloading all layers to the Metal GPU.
 * If the same model is already loaded this is a no-op.
 * If a different model is loaded it is released first.
 */
export async function loadModel(modelId: string): Promise<void> {
  if (_loadedModelId === modelId && _ctx !== null) return;
  await unloadModel();

  const exists = await isModelDownloaded(modelId);
  if (!exists) throw new Error(`Model "${modelId}" is not downloaded. Download it first.`);

  _ctx = await initLlama({
    model: modelFilePath(modelId),
    use_mlock: true,
    n_gpu_layers: 99,
    n_ctx: 4096,
  });
  _loadedModelId = modelId;
}

export async function unloadModel(): Promise<void> {
  if (_ctx !== null) {
    await releaseAllLlama();
    _ctx = null;
    _loadedModelId = null;
  }
}

export function loadedModelId(): string | null {
  return _loadedModelId;
}

// ---------- Streaming completion ----------

const STOP_TOKENS = [
  "<|eot_id|>",
  "<|end_of_text|>",
  "</s>",
  "<|im_end|>",
  "<|endoftext|>",
];

/**
 * Stream a chat completion from the loaded on-device model, yielding text tokens
 * as they arrive (callback → AsyncGenerator bridge via a token queue).
 *
 * The caller must ensure loadModel() has been called and the model is ready.
 */
export async function* onDeviceChatStream(
  messages: LlmMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): AsyncGenerator<string> {
  if (!_ctx) {
    throw new Error("No on-device model loaded. Call loadModel() first.");
  }
  const ctx = _ctx;

  // Token queue + Promise-based wake-up so the generator can yield as tokens arrive.
  const queue: string[] = [];
  let finished = false;
  let wakeup: (() => void) | null = null;

  function enqueue(token: string) {
    queue.push(token);
    const wake = wakeup;
    wakeup = null;
    wake?.();
  }

  function finish() {
    finished = true;
    const wake = wakeup;
    wakeup = null;
    wake?.();
  }

  const completionPromise = ctx
    .completion(
      {
        messages,
        n_predict: opts.maxTokens ?? 768,
        temperature: opts.temperature ?? 0.6,
        stop: STOP_TOKENS,
      },
      (data: TokenData) => {
        if (data.token) enqueue(data.token);
      }
    )
    .then(finish)
    .catch((err: unknown) => {
      finished = true;
      const wake = wakeup;
      wakeup = null;
      wake?.();
      throw err;
    });

  try {
    while (!finished || queue.length > 0) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else {
        await new Promise<void>((resolve) => {
          wakeup = resolve;
        });
      }
    }
  } finally {
    // Drain any remaining queued tokens before surfacing errors.
    while (queue.length > 0) yield queue.shift()!;
  }

  // Propagate any error from the completion promise.
  await completionPromise;
}

/**
 * One-shot completion from the on-device model (collects the full stream).
 */
export async function onDeviceChatOnce(
  messages: LlmMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  let text = "";
  for await (const chunk of onDeviceChatStream(messages, opts)) {
    text += chunk;
  }
  return text;
}
