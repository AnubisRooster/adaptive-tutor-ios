# Adaptive Tutor — iOS

A native iOS port of the [Adaptive Tutor Agent](https://github.com/AnubisRooster/adaptive-tutor-agent),
built with **Expo / React Native**. It teaches, quizzes, detects knowledge gaps, and coaches
across multiple subjects — adapting to each learner's mastery (ZPD) and Bloom's-taxonomy level.

## Architecture

This is a **fully on-device** app. Nothing runs on a server:

- **On the device:** the SQLite database (`expo-sqlite` + Drizzle ORM), the adaptive engine,
  RAG retrieval, curriculum/quiz generation, and URL content ingestion.
- **The only outbound dependency:** the LLM, via **OpenRouter**, using **your own API key**
  (stored in the iOS Keychain via `expo-secure-store`). No telemetry; no backend.

### Why these choices

| Web original | iOS port |
| --- | --- |
| Next.js Node server + `app/api/*` routes | No server — logic runs locally, called directly from screens |
| `better-sqlite3` (native binary) | `expo-sqlite` + `drizzle-orm/expo-sqlite` |
| Ollama daemon (chat + embeddings) | OpenRouter (chat); on-device lexical retrieval (RAG) |
| Cookie sessions | Active-profile id in secure storage |

> Embeddings: OpenRouter has no embeddings endpoint and we keep processing local, so v1 uses
> **lexical (keyword/BM25) retrieval** over ingested content rather than vector similarity.
> On-device neural embeddings are a future enhancement.

## Project layout

```
app/        Expo Router screens (file-based routing)
lib/        Ported domain logic (adaptive engine, prompts, schemas, RAG, generators, OpenRouter)
db/         Drizzle schema + first-run curriculum seeder
__tests__/  Jest test suites
```

## Development

```bash
npm install        # uses legacy-peer-deps (see .npmrc) for RN 19 peer churn
npm start          # Expo dev server (open in Expo Go or a dev build)
npm run ios        # iOS simulator (requires macOS)

npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # jest
```

CI (`.github/workflows/ci.yml`) runs typecheck + lint + test on every push/PR to `main`.

## Build & release

EAS Build (cloud) produces iOS builds without a local Mac; see `eas.json`. A physical iPhone
or the iOS Simulator (macOS) is needed to run device builds.

```bash
eas build --platform ios --profile preview      # internal/simulator build
eas build --platform ios --profile production    # store build
eas submit --platform ios
```

## Roadmap (phased delivery)

- **Phase 0 — Foundations** ✅ Expo + Router scaffold, jest-expo, ESLint/Prettier, CI, EAS config.
- **Phase 1 — Domain core** Port pure-TS logic + tests; stand up on-device SQLite + seeder.
- **Phase 2 — LLM integration** OpenRouter (streaming via `expo/fetch`), secure key storage.
- **Phase 3 — Core learner UI** Profiles, Learn, Settings screens; markdown + math rendering.
- **Phase 4 — Quizzes & mastery** Quiz flow, grading, Bloom progression, gamification.
- **Phase 5 — URL ingestion** Add material by URL; on-device lexical retrieval grounds answers.
- **Phase 6 — Polish & submission** iOS UX, native capabilities, App Store assets, submit.
