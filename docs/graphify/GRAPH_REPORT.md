# Graph Report - adaptive-tutor-ios  (2026-09-09)

## Corpus Check
- 132 files · ~334,560 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 673 nodes · 1599 edges · 43 communities (36 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- learn.tsx
- ingest.tsx
- search.test.tsx
- data.ts
- gamify.ts
- expo
- graph.tsx
- ingest.test.ts
- llm.ts
- package.json
- openrouter.ts
- setup.tsx
- adaptive.ts
- dependencies
- SettingsScreen()
- ondevice.ts
- settings.tsx
- notify.test.ts
- devDependencies
- prompts.ts
- _layout.tsx
- profiles.test.tsx
- progress.tsx
- MarkdownText.tsx
- scripts
- quiz.test.tsx
- curriculum-gen.ts
- subtopic-nav.ts
- tsconfig.json
- index.tsx
- learn.test.tsx
- Topic
- jest
- index.ts
- eslint.config.js
- withReleaseRunScheme.js
- graphify_pipeline.py
- drizzle-kit
- withoutPushEntitlement.js
- withoutScriptSandboxing.js

## God Nodes (most connected - your core abstractions)
1. `getStudent()` - 30 edges
2. `SettingsScreen()` - 25 edges
3. `LearnScreen()` - 22 edges
4. `react` - 22 edges
5. `getTopic()` - 21 edges
6. `getActiveStudentId()` - 19 edges
7. `listSubjects()` - 18 edges
8. `resolveLlmConfigById()` - 18 edges
9. `react-native` - 16 edges
10. `listTopics()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `openModelPicker()` --calls--> `fetchModelCatalog()`  [EXTRACTED]
  app/learn.tsx → lib/openrouter.ts
- `removeKey()` --calls--> `deleteApiKey()`  [EXTRACTED]
  app/settings.tsx → lib/key-store.ts
- `handleCloudConsentToggle()` --calls--> `grantCloudConsent()`  [EXTRACTED]
  app/settings.tsx → lib/setup.ts
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts

## Import Cycles
- None detected.

## Communities (43 total, 4 thin omitted)

### Community 0 - "learn.tsx"
Cohesion: 0.06
Nodes (67): BLOOM_NAMES, ChatMsg, LearnScreen(), loadRecentMessages(), markNextTaught(), onSend(), openModelPicker(), streamTutor() (+59 more)

### Community 1 - "ingest.tsx"
Cohesion: 0.09
Nodes (31): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+23 more)

### Community 2 - "search.test.tsx"
Cohesion: 0.10
Nodes (26): switchProfile(), SearchScreen(), styles, getAllTopics(), listChunks(), listSubjects(), RetrievedChunk, scoreBm25() (+18 more)

### Community 3 - "data.ts"
Cohesion: 0.09
Nodes (18): Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Message, messages, Session (+10 more)

### Community 4 - "gamify.ts"
Cohesion: 0.16
Nodes (24): ProgressScreen(), addXp(), countClearedGaps(), countMasteredTopics(), getStudent(), grantAchievement(), listAchievements(), listTouchedSubjectIds() (+16 more)

### Community 5 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+18 more)

### Community 6 - "graph.tsx"
Cohesion: 0.12
Nodes (19): KnowledgeMapScreen(), styles, GRAPH_HTML, KnowledgeGraphView(), Props, styles, buildTopicGraph(), CYTOSCAPE_MIN_JS (+11 more)

### Community 7 - "ingest.test.ts"
Cohesion: 0.16
Nodes (20): chunkText(), addGap(), addMessage(), createSource(), insertKnowledgeChunk(), now(), touchStudent(), updateSource() (+12 more)

### Community 8 - "llm.ts"
Cohesion: 0.13
Nodes (18): Student, deleteApiKey(), getApiKey(), setApiKey(), storeKey(), ChatOpts, LlmProvider, resolveLlmConfig() (+10 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (22): main, name, private, version, babel-preset-expo, drizzle-orm, eslint, eslint-config-expo (+14 more)

### Community 10 - "openrouter.ts"
Cohesion: 0.16
Nodes (18): buildBody(), buildHeaders(), ChatOpts, fetchModelCatalog(), normalizeModel(), OPENROUTER_BASE, openrouterChatOnce(), openrouterChatStream() (+10 more)

### Community 11 - "setup.tsx"
Cohesion: 0.17
Nodes (17): DownloadState, SetupScreen(), finish(), skip(), toggleConsent(), styles, DownloadProgress, formatBytes() (+9 more)

### Community 12 - "adaptive.ts"
Cohesion: 0.17
Nodes (17): applyGrade(), clamp(), NextStep, recommendStartTopic(), selectNextTopic(), clearGapsForTopic(), deleteSubject(), deleteTopic() (+9 more)

### Community 13 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, babel-preset-expo, drizzle-orm, expo, expo-constants, expo-file-system, expo-linking, expo-local-authentication (+12 more)

### Community 14 - "SettingsScreen()"
Cohesion: 0.14
Nodes (19): selectModel(), formatHour(), SettingsScreen(), cancelDownload(), handleCloudConsentToggle(), handleDeleteModel(), loadModels(), removeKey() (+11 more)

### Community 15 - "ondevice.ts"
Cohesion: 0.15
Nodes (16): startDownload(), startDownload(), ActiveDownload, downloadModel(), ensureModelsDir(), isModelDownloaded(), loadModel(), modelFilePath() (+8 more)

### Community 16 - "settings.tsx"
Cohesion: 0.19
Nodes (15): RootLayout(), handleUnlock(), DownloadState, handleBiometricToggle(), styles, authenticateWithBiometrics(), getBiometricLockEnabled(), isBiometricAvailable() (+7 more)

### Community 17 - "notify.test.ts"
Cohesion: 0.20
Nodes (13): adjustHour(), handleReminderToggle(), cancelDailyReminder(), getReminderSettings(), requestNotificationPermission(), scheduleDailyReminder(), expo-notifications, mockCancel (+5 more)

### Community 18 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, drizzle-kit, eslint, eslint-config-expo, eslint-config-prettier, jest, jest-expo, prettier (+7 more)

### Community 19 - "prompts.ts"
Cohesion: 0.19
Nodes (12): Gap, Mastery, Subject, buildGradeMessages(), Focus, masteryBand(), SubtopicProgressEntry, TONE_GUIDE (+4 more)

### Community 20 - "_layout.tsx"
Cohesion: 0.17
Nodes (8): styles, ROW_STYLE, styles, expo-router, expo-status-bar, react-native-safe-area-context, mockIngestUrl, mockRouter

### Community 21 - "profiles.test.tsx"
Cohesion: 0.27
Nodes (11): ProfilesScreen(), handleCreate(), selectStudent(), createStudent(), hashPin(), listStudents(), verifyPin(), setActiveStudentId() (+3 more)

### Community 22 - "progress.tsx"
Cohesion: 0.21
Nodes (9): BLOOM_NAMES, PHASE_LABELS, styles, Summary, MasteryBar(), Props, styles, react (+1 more)

### Community 23 - "MarkdownText.tsx"
Cohesion: 0.23
Nodes (10): BlockToken, LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath(), sanitizeLatex(), Segment (+2 more)

### Community 24 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android, format, ios, lint, metadata:pull, metadata:push, start (+4 more)

### Community 25 - "quiz.test.tsx"
Cohesion: 0.18
Nodes (10): APPLY_RESULT, GAMIFY_RESULT, GRADE, mockApply, mockAward, mockGenerate, mockGrade, mockResolve (+2 more)

### Community 26 - "curriculum-gen.ts"
Cohesion: 0.33
Nodes (7): curriculumFormat, curriculumMessages(), generateCurriculumDraft(), parseCurriculumDraft(), LlmMessage, CurriculumDraft, VALID_DRAFT

### Community 27 - "subtopic-nav.ts"
Cohesion: 0.33
Nodes (7): allQuizzed(), findNextSubtopic(), findNextToTeach(), ProgressMap, SubtopicItem, SubtopicProgressEntry, items

### Community 28 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 29 - "index.tsx"
Cohesion: 0.32
Nodes (6): COLORS, styles, ProfileAvatar(), Props, styles, react-native

### Community 30 - "learn.test.tsx"
Cohesion: 0.29
Nodes (5): mockParams, mockPush, mockReplace, mockResolve, mockStream

### Community 31 - "Topic"
Cohesion: 0.40
Nodes (3): Topic, slugify(), uniqueSubjectId()

### Community 32 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

### Community 33 - "index.ts"
Cohesion: 0.50
Nodes (3): db, expo, expo-sqlite

### Community 34 - "eslint.config.js"
Cohesion: 0.50
Nodes (3): expoConfig, prettier, eslint-config-prettier

### Community 35 - "withReleaseRunScheme.js"
Cohesion: 0.50
Nodes (3): fs, path, { withDangerousMod }

## Knowledge Gaps
- **254 isolated node(s):** `mockRouter`, `mockIngestUrl`, `mockReplace`, `mockPush`, `mockParams` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 297 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `progress.tsx` to `learn.tsx`, `ingest.tsx`, `search.test.tsx`, `graph.tsx`, `package.json`, `openrouter.ts`, `setup.tsx`, `ondevice.ts`, `settings.tsx`, `_layout.tsx`, `profiles.test.tsx`, `MarkdownText.tsx`, `quiz.test.tsx`, `index.tsx`, `learn.test.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `react-native` connect `index.tsx` to `learn.tsx`, `ingest.tsx`, `search.test.tsx`, `graph.tsx`, `package.json`, `setup.tsx`, `settings.tsx`, `_layout.tsx`, `progress.tsx`, `MarkdownText.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `mockRouter`, `mockIngestUrl`, `mockReplace` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.061708860759493674 - nodes in this community are weakly interconnected._
- **Should `ingest.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09388335704125178 - nodes in this community are weakly interconnected._
- **Should `search.test.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10420168067226891 - nodes in this community are weakly interconnected._