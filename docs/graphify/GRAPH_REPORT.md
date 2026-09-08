# Graph Report - adaptive-tutor-ios  (2026-09-08)

## Corpus Check
- 105 files · ~165,955 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 604 nodes · 1397 edges · 27 communities (20 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- settings.tsx
- quiz.tsx
- data.ts
- ingest.tsx
- progress.tsx
- learn.tsx
- gamify.ts
- graph.tsx
- openrouter.ts
- expo
- prompts.ts
- package.json
- dependencies
- devDependencies
- MarkdownText.tsx
- scripts
- tsconfig.json
- jest
- eslint.config.js
- withReleaseRunScheme.js
- graphify_pipeline.py
- drizzle-kit
- withoutPushEntitlement.js
- withoutScriptSandboxing.js

## God Nodes (most connected - your core abstractions)
1. `getStudent()` - 25 edges
2. `SettingsScreen()` - 23 edges
3. `LearnScreen()` - 22 edges
4. `getTopic()` - 21 edges
5. `react` - 18 edges
6. `resolveLlmConfigById()` - 17 edges
7. `listTopics()` - 15 edges
8. `chatOnce()` - 15 edges
9. `generateQuizQuestion()` - 15 edges
10. `now()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts
- `KnowledgeMapScreen()` --calls--> `getMasteryMap()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts
- `KnowledgeMapScreen()` --calls--> `getStudent()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts
- `KnowledgeMapScreen()` --calls--> `listSubjects()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts

## Import Cycles
- None detected.

## Communities (27 total, 4 thin omitted)

### Community 0 - "settings.tsx"
Cohesion: 0.05
Nodes (66): RootLayout(), handleUnlock(), styles, selectModel(), DownloadState, formatHour(), SettingsScreen(), adjustHour() (+58 more)

### Community 1 - "quiz.tsx"
Cohesion: 0.07
Nodes (59): Phase, QuizScreen(), nextQuestion(), startSession(), submitAnswer(), SCORE_COLOR(), SessionResult, styles (+51 more)

### Community 2 - "data.ts"
Cohesion: 0.05
Nodes (54): db, expo, Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Mastery (+46 more)

### Community 3 - "ingest.tsx"
Cohesion: 0.09
Nodes (38): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+30 more)

### Community 4 - "progress.tsx"
Cohesion: 0.09
Nodes (34): COLORS, ProfilesScreen(), handleCreate(), selectStudent(), styles, switchProfile(), BLOOM_NAMES, PHASE_LABELS (+26 more)

### Community 5 - "learn.tsx"
Cohesion: 0.09
Nodes (29): BLOOM_NAMES, ChatMsg, LearnScreen(), loadRecentMessages(), markNextTaught(), onSend(), streamTutor(), updateLastAssistant() (+21 more)

### Community 6 - "gamify.ts"
Cohesion: 0.10
Nodes (30): addXp(), countClearedGaps(), countMasteredTopics(), grantAchievement(), listAchievements(), listTouchedSubjectIds(), setStreak(), awardForGrade() (+22 more)

### Community 7 - "graph.tsx"
Cohesion: 0.12
Nodes (19): KnowledgeMapScreen(), styles, GRAPH_HTML, KnowledgeGraphView(), Props, styles, buildTopicGraph(), CYTOSCAPE_MIN_JS (+11 more)

### Community 8 - "openrouter.ts"
Cohesion: 0.14
Nodes (21): openModelPicker(), loadModels(), validateAndSave(), buildBody(), buildHeaders(), ChatOpts, fetchModelCatalog(), normalizeModel() (+13 more)

### Community 9 - "expo"
Cohesion: 0.09
Nodes (22): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+14 more)

### Community 10 - "prompts.ts"
Cohesion: 0.13
Nodes (19): BLOOM_LEVELS, bloomName(), SeedSubject, SeedTopic, SUBJECTS, TOPICS, Gap, Subject (+11 more)

### Community 11 - "package.json"
Cohesion: 0.09
Nodes (22): main, name, private, version, babel-preset-expo, drizzle-orm, eslint, eslint-config-expo (+14 more)

### Community 12 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, babel-preset-expo, drizzle-orm, expo, expo-constants, expo-file-system, expo-linking, expo-local-authentication (+12 more)

### Community 13 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, drizzle-kit, eslint, eslint-config-expo, eslint-config-prettier, jest, jest-expo, prettier (+7 more)

### Community 14 - "MarkdownText.tsx"
Cohesion: 0.23
Nodes (10): BlockToken, LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath(), sanitizeLatex(), Segment (+2 more)

### Community 15 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, android, format, ios, lint, start, test, test:watch (+2 more)

### Community 16 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 17 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

### Community 18 - "eslint.config.js"
Cohesion: 0.50
Nodes (3): expoConfig, prettier, eslint-config-prettier

### Community 19 - "withReleaseRunScheme.js"
Cohesion: 0.50
Nodes (3): fs, path, { withDangerousMod }

## Knowledge Gaps
- **223 isolated node(s):** `mockRouter`, `mockIngestUrl`, `mockStream`, `mockResolve`, `mockList` (+218 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 262 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `progress.tsx` to `settings.tsx`, `quiz.tsx`, `ingest.tsx`, `learn.tsx`, `gamify.ts`, `graph.tsx`, `openrouter.ts`, `package.json`, `MarkdownText.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `mockRouter`, `mockIngestUrl`, `mockStream` to the rest of the system?**
  _223 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05126452494873548 - nodes in this community are weakly interconnected._
- **Should `quiz.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06807017543859649 - nodes in this community are weakly interconnected._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051929824561403506 - nodes in this community are weakly interconnected._