# Adaptive Tutor → iOS (Path B: React Native + Expo)

## Context

`adaptive-tutor-agent` is a Next.js 15 full-stack web app: a Node server with `app/api/*`
routes, a `better-sqlite3` database, an Ollama daemon for chat **and** embeddings, and a
responsive React UI. The goal is a native iOS app installable from the App Store.

Per the user's decisions, the target architecture is **fully on-device** with no cloud
backend:

- **Local on the iPhone:** SQLite data, all business logic (adaptive engine, RAG retrieval,
  curriculum/quiz/subtopic generation orchestration), and URL content ingestion.
- **Cloud (only outbound dependency):** the LLM, via **OpenRouter**, using **each user's own
  API key** (the app already models this per-profile in `lib/llm.ts` / `lib/openrouter.ts`).
- **v1 feature scope:** learner experience + **URL ingestion only** (no PDF upload, no
  paste-text). Admin portal is **out of scope** for v1.

This removes the three blockers (native `better-sqlite3`, Ollama daemon, Node server) by
moving everything the app does onto the device and calling OpenRouter directly.

### The one true gap: embeddings

RAG today uses Ollama's `nomic-embed-text` for embeddings. OpenRouter has **no embeddings
endpoint**, and "local processing only" rules out a cloud embeddings API. Recommendation for
v1: **on-device lexical retrieval** (keyword/BM25-style overlap) instead of vector cosine.
Content volume is tiny (a few ingested URLs), and `lib/rag.ts` already has a non-embedding
fallback path (`retrieveContext` lines 62–68) we extend. On-device neural embeddings
(`react-native-executorch`/ONNX MiniLM) are a documented future enhancement, not v1.

## Approach

New Expo (TypeScript) app in a fresh GitHub repo. The pure-TypeScript domain logic in `lib/`
ports almost verbatim; the data layer swaps `better-sqlite3` → `expo-sqlite` (both via Drizzle
ORM); the Next.js `app/api/*` routes collapse into direct local service calls (no HTTP); the
React DOM UI is rewritten as React Native screens. TDD throughout, phased delivery, each phase
shippable to TestFlight.

### What ports as-is vs. what's rebuilt

| Layer | Source | Disposition |
|---|---|---|
| Adaptive engine | `lib/adaptive.ts` | **Port verbatim** (pure TS) |
| Prompts | `lib/prompts.ts` | **Port verbatim** |
| Zod schemas | `lib/schemas.ts` | **Port verbatim** |
| Gamification | `lib/gamify.ts`, `lib/gamify-catalog.ts` | **Port verbatim** |
| Chunk splitter | `lib/chunk.ts` | **Port verbatim** |
| URL fetch/extract | `lib/html.ts`, `lib/robots.ts`, `lib/crawl.ts` | **Port** (pure `fetch`/regex — RN-safe) |
| Generators | `lib/curriculum-gen.ts`, `lib/quiz-gen.ts`, `lib/subtopics-gen.ts`, `lib/orchestrator.ts` | **Port**, repoint to local LLM dispatch |
| OpenRouter client | `lib/openrouter.ts` | **Port**; swap streaming reader for `expo/fetch` |
| LLM dispatch | `lib/llm.ts` | **Simplify** to OpenRouter-only (drop Ollama branch) |
| Embeddings/RAG | `lib/ollama.ts` embed, `lib/rag.ts` | **Rebuild** as on-device lexical retrieval |
| Data access | `lib/data.ts`, `db/*` | **Rebuild** on `expo-sqlite` + `drizzle-orm/expo-sqlite` (async) |
| Seed/curriculum | `db/curriculum.ts`, `db/ddl.ts`, `scripts/seed.ts`, `content/*.md` | **Port** as a bundled first-run seeder |
| API routes | `app/api/*` | **Delete** — replace with local service functions |
| Sessions | `lib/session.ts` (cookies) | **Replace** with on-device "active profile" in `expo-secure-store`/AsyncStorage |
| Learner UI | `app/page.tsx`, `app/learn/page.tsx` | **Rewrite** as RN screens |
| Markdown+math | `components/MarkdownLite.tsx` (KaTeX) | **Rewrite** with RN math renderer |
| Admin UI | `app/admin/page.tsx`, most of `ContentModals.tsx` | **Out of scope (v1)** |

### Key technical decisions

- **DB:** `expo-sqlite` + `drizzle-orm/expo-sqlite`. Schema in `db/schema.ts` ports unchanged
  (Drizzle SQLite-core). Drizzle's Expo driver is **async**, so `lib/data.ts` accessors become
  `async`/`await` (today they're synchronous `.get()/.all()/.run()`). Migrations via
  `drizzle-kit` + `useMigrations`.
- **Streaming:** RN's global `fetch` can't read `res.body.getReader()`. Use **`expo/fetch`**
  (Expo SDK 52+ streaming fetch) in the ported `openrouter.ts` so token streaming keeps working.
- **API key storage:** `expo-secure-store` (Keychain-backed), not the DB column, for the
  OpenRouter key. Validated via existing `validateApiKey()`.
- **Math/chemistry:** replace KaTeX-in-DOM with a WebView-based KaTeX renderer (or
  `react-native-katex`) inside the markdown component; mhchem support retained.
- **Navigation:** Expo Router (file-based), mirroring `profiles → learn` flow.
- **Test runner:** unify on **`jest-expo` + React Native Testing Library**. Migrate the 15
  existing `vitest` specs (assertion syntax is near-identical) so pure-logic tests run first
  and stay green through the port.

## Phased delivery

Each phase ends green (CI passing) and, from Phase 3 on, produces a TestFlight build.

### Phase 0 — Foundations
- New GitHub repo; Expo TS app (`create-expo-app`), Expo Router, ESLint/Prettier, `jest-expo`.
- GitHub Actions CI: typecheck + lint + `jest` on every push/PR. Conventional-commits, PR-based.
- EAS project init (`eas.json`) with dev/preview/production profiles; Apple Developer account
  + bundle id reserved. No build yet.
- **Exit:** empty app runs in simulator; CI green.

### Phase 1 — Domain core (TDD, no UI)
- Port `schemas.ts`, `adaptive.ts`, `prompts.ts`, `gamify*.ts`, `chunk.ts` verbatim. **Port
  their existing tests first** (`tests/unit/{schemas,gamify,prompts,chunk,curriculum,…}.test.ts`)
  — these are the TDD spec for the port; make them pass under `jest`.
- Stand up `expo-sqlite` + Drizzle: port `db/schema.ts`; rebuild `lib/data.ts` as async
  accessors; port the seed (`db/curriculum.ts` + `content/*.md`) into a first-run seeder with a
  test asserting a fresh DB seeds the built-in subjects/topics/chunks.
- **Exit:** all ported logic tests + new data-layer tests green in CI.

### Phase 2 — LLM integration (TDD)
- Port `openrouter.ts`; swap the streaming reader to `expo/fetch`. Simplify `lib/llm.ts` to
  OpenRouter-only. Port `orchestrator.ts`, `quiz-gen.ts`, `subtopics-gen.ts`,
  `curriculum-gen.ts` repointed to the simplified dispatch.
- `expo-secure-store` key storage + `validateApiKey`. Tests mock `fetch`/`expo-fetch` (reuse
  patterns from `tests/unit/openrouter.test.ts`, `llm.test.ts`).
- **Exit:** can run a graded turn end-to-end against OpenRouter from a test harness; specs green.

### Phase 3 — Core learner UI
- Expo Router screens: **Profiles** (port `app/page.tsx` — create/select/PIN, color picker)
  and **Learn** (port `app/learn/page.tsx` — subject/topic sidebar→drawer, chat composer,
  streaming tutor responses). Active-profile state via SecureStore/AsyncStorage replacing the
  cookie session.
- Settings screen: enter/validate OpenRouter key + pick model (port `ModelPicker.tsx` logic).
- RN markdown+math component (KaTeX via WebView) with mhchem.
- RNTL component tests for profile create/select and a streamed chat turn (mocked LLM).
- **Exit:** first **TestFlight** build; a learner can pick a profile, choose a topic, and chat.

### Phase 4 — Quizzes, grading, mastery, gamification
- Quiz flow (`quiz-gen` → answer → `applyGrade` from `adaptive.ts`), mastery/Bloom progress
  UI, gaps, next-topic recommendation, achievements (port `AchievementsModal.tsx`), subtopic
  focus drill-down.
- Tests: grading updates mastery/Bloom/gaps correctly (extend ported `adaptive.test.ts`); quiz
  UI renders and submits.
- **Exit:** full single-topic learn→quiz→advance loop on device; TestFlight build.

### Phase 5 — URL ingestion + on-device retrieval
- Port `html.ts`/`robots.ts`/`crawl.ts`/`ingest.ts`; wire a "+ Add material (URL)" flow
  (single page; optional bounded same-site crawl). Background chunking with progress, written
  to local `knowledge_chunks`/`sources`.
- **Rebuild retrieval as lexical** (BM25/keyword overlap) in the ported `rag.ts`, keeping the
  `contextBlock` budget logic. Test: ingested URL chunks surface for a relevant query and feed
  the tutor's context.
- **Exit:** add a URL, then see the tutor ground answers in it; TestFlight build.

### Phase 6 — Polish & App Store submission
- iOS UX pass (safe areas, dark mode via `ThemeToggle` logic, keyboard handling, offline
  states when no key/network). Optional native: `expo-local-authentication` (Face ID to unlock
  a PIN profile), `expo-notifications` (study reminders) — at least one native capability
  strengthens review for a non-trivial app.
- App Store assets: icon (reuse `assets/AppIcon.png`), screenshots, privacy nutrition label
  (data stays on device; only OpenRouter calls leave), App Privacy answers.
- `eas build --platform ios` → `eas submit`. App Review notes: explain BYO OpenRouter key and
  provide a reviewer test key/flow (Apple rejects apps gated behind credentials reviewers
  can't get past).
- **Exit:** app submitted to App Store review.

## Risks / watch-items
- **BYO-key review risk:** Apple may flag a key wall. Mitigate with a clear onboarding, a
  "how to get a free OpenRouter key" guide, and a reviewer key in App Review notes. (If
  rejected, fallback is a managed free tier — revisit the AI-provisioning decision.)
- **Drizzle async port:** mechanical but touches every `data.ts` call site; covered by Phase 1
  tests. `op-sqlite` (sync API) is a fallback if async churn is too costly.
- **Streaming on RN:** depends on `expo/fetch`; `react-native-sse` is the fallback.
- **Math rendering** in RN is fiddlier than web KaTeX; WebView approach is the safe default.

## Verification
- **Unit/logic:** `jest` (ported vitest specs + new data/retrieval tests) in CI on every PR.
- **Component:** React Native Testing Library for screens (mocked LLM/network).
- **Device E2E (manual per phase):** Expo Go / dev build in the iOS Simulator — create profile,
  pick topic, stream a chat turn (real OpenRouter key), take a quiz, ingest a URL and confirm
  grounding.
- **Release:** EAS internal-distribution build verified on a physical iPhone before each
  `eas submit`.
```
