# Graph Report - adaptive-tutor-ios  (2026-09-14)

## Corpus Check
- 136 files · ~344,854 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .jsonl 1, .xcscheme 1)

## Summary
- 713 nodes · 1783 edges · 37 communities (31 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- quiz.tsx
- learn.tsx
- ingest.tsx
- data.ts
- gamify.ts
- settings.tsx
- search.test.tsx
- expo
- setup.tsx
- package.json
- progress.tsx
- session.ts
- dependencies
- ondevice.ts
- index.tsx
- adaptive.ts
- openrouter.ts
- graph.tsx
- settings.test.tsx
- react-native
- devDependencies
- MarkdownText.tsx
- scripts
- getMastery()
- KnowledgeGraphView.tsx
- tsconfig.json
- react
- Topic
- jest
- eslint.config.js
- withReleaseRunScheme.js
- graphify_pipeline.py
- withoutPushEntitlement.js
- withoutScriptSandboxing.js

## God Nodes (most connected - your core abstractions)
1. `SettingsScreen()` - 44 edges
2. `LearnScreen()` - 39 edges
3. `getStudent()` - 33 edges
4. `react` - 24 edges
5. `VoiceScreen()` - 23 edges
6. `getActiveStudentId()` - 23 edges
7. `SetupScreen()` - 22 edges
8. `resolveLlmConfigById()` - 22 edges
9. `getTopic()` - 21 edges
10. `QuizScreen()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `saveOrModel()` --calls--> `updateStudentModel()`  [EXTRACTED]
  app/settings.tsx → lib/data.ts
- `selectOndeviceModel()` --calls--> `updateStudentOndeviceModel()`  [EXTRACTED]
  app/settings.tsx → lib/data.ts
- `switchProvider()` --calls--> `updateStudentProvider()`  [EXTRACTED]
  app/settings.tsx → lib/data.ts
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts

## Import Cycles
- None detected.

## Communities (37 total, 3 thin omitted)

### Community 0 - "quiz.tsx"
Cohesion: 0.05
Nodes (70): Phase, QuizScreen(), nextQuestion(), startSession(), submitAnswer(), SCORE_COLOR(), SessionResult, styles (+62 more)

### Community 1 - "learn.tsx"
Cohesion: 0.06
Nodes (57): BLOOM_NAMES, ChatMsg, LearnScreen(), loadRecentMessages(), onSend(), streamTutor(), updateLastAssistant(), PHASE_LABELS (+49 more)

### Community 2 - "ingest.tsx"
Cohesion: 0.07
Nodes (45): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+37 more)

### Community 3 - "data.ts"
Cohesion: 0.09
Nodes (17): Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Message, messages, Session (+9 more)

### Community 4 - "gamify.ts"
Cohesion: 0.15
Nodes (24): ProgressScreen(), addXp(), countClearedGaps(), countMasteredTopics(), getMasteryMap(), listAchievements(), listTouchedSubjectIds(), setStreak() (+16 more)

### Community 5 - "settings.tsx"
Cohesion: 0.13
Nodes (26): DownloadState, formatHour(), SettingsScreen(), adjustHour(), cancelDownload(), handleDeleteModel(), handleReminderToggle(), handleSpeakRepliesToggle() (+18 more)

### Community 6 - "search.test.tsx"
Cohesion: 0.14
Nodes (21): SearchScreen(), styles, getAllTopics(), listChunks(), listSubjects(), retrieveContext(), RetrievedChunk, scoreBm25() (+13 more)

### Community 7 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+18 more)

### Community 8 - "setup.tsx"
Cohesion: 0.16
Nodes (22): selectModel(), handleCloudConsentToggle(), DownloadState, SetupScreen(), finish(), selectOndeviceModel(), skip(), toggleConsent() (+14 more)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (23): main, name, private, version, babel-preset-expo, drizzle-kit, drizzle-orm, eslint (+15 more)

### Community 10 - "progress.tsx"
Cohesion: 0.12
Nodes (20): BLOOM_NAMES, PHASE_LABELS, styles, Summary, Gap, Mastery, Student, Subject (+12 more)

### Community 11 - "session.ts"
Cohesion: 0.13
Nodes (19): RootLayout(), handleUnlock(), switchProfile(), handleBiometricToggle(), authenticateWithBiometrics(), getBiometricLockEnabled(), isBiometricAvailable(), setBiometricLockEnabled() (+11 more)

### Community 12 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, babel-preset-expo, drizzle-orm, expo, expo-constants, expo-file-system, expo-linking, expo-local-authentication (+14 more)

### Community 13 - "ondevice.ts"
Cohesion: 0.13
Nodes (18): startDownload(), startDownload(), ActiveDownload, downloadModel(), DownloadProgress, ensureModelsDir(), isModelDownloaded(), loadModel() (+10 more)

### Community 14 - "index.tsx"
Cohesion: 0.19
Nodes (17): COLORS, ProfilesScreen(), handleCreate(), selectStudent(), styles, ProfileAvatar(), Props, styles (+9 more)

### Community 15 - "adaptive.ts"
Cohesion: 0.16
Nodes (17): applyGrade(), ApplyGradeResult, clamp(), NextStep, recommendStartTopic(), selectNextTopic(), addGap(), clearGapsForTopic() (+9 more)

### Community 16 - "openrouter.ts"
Cohesion: 0.17
Nodes (16): openModelPicker(), loadModels(), validateAndSave(), buildBody(), buildHeaders(), ChatOpts, fetchModelCatalog(), normalizeModel() (+8 more)

### Community 17 - "graph.tsx"
Cohesion: 0.20
Nodes (13): KnowledgeMapScreen(), styles, KnowledgeGraphView(), buildTopicGraph(), GraphEdge, GraphMasteryInput, GraphNode, GraphTopicInput (+5 more)

### Community 18 - "settings.test.tsx"
Cohesion: 0.18
Nodes (13): removeKey(), deleteApiKey(), getApiKey(), setApiKey(), storeKey(), mockGetKey, mockHasConsent, mockSetKey (+5 more)

### Community 19 - "react-native"
Cohesion: 0.16
Nodes (10): styles, ROW_STYLE, styles, db, expo, expo-router, expo-sqlite, expo-status-bar (+2 more)

### Community 20 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, drizzle-kit, eslint, eslint-config-expo, eslint-config-prettier, jest, jest-expo, prettier (+7 more)

### Community 21 - "MarkdownText.tsx"
Cohesion: 0.23
Nodes (10): BlockToken, LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath(), sanitizeLatex(), Segment (+2 more)

### Community 22 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android, format, ios, lint, metadata:pull, metadata:push, start (+4 more)

### Community 23 - "getMastery()"
Cohesion: 0.35
Nodes (11): markNextTaught(), getMastery(), grantAchievement(), markSubtopicQuizzed(), markSubtopicTaught(), now(), parseProgress(), recomputePhase() (+3 more)

### Community 24 - "KnowledgeGraphView.tsx"
Cohesion: 0.28
Nodes (6): GRAPH_HTML, Props, styles, CYTOSCAPE_MIN_JS, buildGraphHtml(), react-native-webview

### Community 25 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 26 - "react"
Cohesion: 0.40
Nodes (4): MasteryBar(), Props, styles, react

### Community 27 - "Topic"
Cohesion: 0.40
Nodes (3): Topic, slugify(), uniqueSubjectId()

### Community 28 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

### Community 29 - "eslint.config.js"
Cohesion: 0.50
Nodes (3): expoConfig, prettier, eslint-config-prettier

### Community 30 - "withReleaseRunScheme.js"
Cohesion: 0.50
Nodes (3): fs, path, { withDangerousMod }

## Knowledge Gaps
- **272 isolated node(s):** `mockRouter`, `mockIngestUrl`, `mockReplace`, `mockPush`, `mockParams` (+267 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 319 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `quiz.tsx`, `learn.tsx`, `ingest.tsx`, `settings.tsx`, `search.test.tsx`, `setup.tsx`, `package.json`, `progress.tsx`, `ondevice.ts`, `index.tsx`, `graph.tsx`, `settings.test.tsx`, `react-native`, `MarkdownText.tsx`, `KnowledgeGraphView.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `react-native` connect `react-native` to `quiz.tsx`, `learn.tsx`, `ingest.tsx`, `settings.tsx`, `search.test.tsx`, `setup.tsx`, `package.json`, `progress.tsx`, `index.tsx`, `graph.tsx`, `MarkdownText.tsx`, `KnowledgeGraphView.tsx`, `react`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `mockRouter`, `mockIngestUrl`, `mockReplace` to the rest of the system?**
  _272 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `quiz.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05362614913176711 - nodes in this community are weakly interconnected._
- **Should `learn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0567287784679089 - nodes in this community are weakly interconnected._
- **Should `ingest.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06838106370543542 - nodes in this community are weakly interconnected._