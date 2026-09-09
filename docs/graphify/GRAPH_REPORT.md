# Graph Report - adaptive-tutor-ios  (2026-09-09)

## Corpus Check
- 129 files · ~331,976 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 671 nodes · 1597 edges · 41 communities (34 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- quiz.tsx
- ingest.tsx
- learn.tsx
- data.ts
- gamify.ts
- expo
- graph.tsx
- setup.tsx
- package.json
- settings.tsx
- openrouter.ts
- dependencies
- index.tsx
- search.tsx
- ondevice.ts
- search.test.tsx
- biometric.test.ts
- notify.test.ts
- devDependencies
- prompts.ts
- settings.test.tsx
- progress.tsx
- MarkdownText.tsx
- scripts
- getActiveStudentId()
- tsconfig.json
- curriculum.ts
- adaptive.test.ts
- Student
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
- `removeKey()` --calls--> `deleteApiKey()`  [EXTRACTED]
  app/settings.tsx → lib/key-store.ts
- `handleCloudConsentToggle()` --calls--> `grantCloudConsent()`  [EXTRACTED]
  app/settings.tsx → lib/setup.ts
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts
- `KnowledgeMapScreen()` --calls--> `getMasteryMap()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts

## Import Cycles
- None detected.

## Communities (41 total, 4 thin omitted)

### Community 0 - "quiz.tsx"
Cohesion: 0.05
Nodes (76): Phase, QuizScreen(), nextQuestion(), startSession(), submitAnswer(), SCORE_COLOR(), SessionResult, styles (+68 more)

### Community 1 - "ingest.tsx"
Cohesion: 0.07
Nodes (43): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+35 more)

### Community 2 - "learn.tsx"
Cohesion: 0.09
Nodes (41): BLOOM_NAMES, ChatMsg, LearnScreen(), loadRecentMessages(), markNextTaught(), onSend(), streamTutor(), updateLastAssistant() (+33 more)

### Community 3 - "data.ts"
Cohesion: 0.09
Nodes (17): Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Message, messages, Session (+9 more)

### Community 4 - "gamify.ts"
Cohesion: 0.15
Nodes (23): addXp(), countClearedGaps(), countMasteredTopics(), grantAchievement(), listAchievements(), listTouchedSubjectIds(), setStreak(), awardForGrade() (+15 more)

### Community 5 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+18 more)

### Community 6 - "graph.tsx"
Cohesion: 0.12
Nodes (19): KnowledgeMapScreen(), styles, GRAPH_HTML, KnowledgeGraphView(), Props, styles, buildTopicGraph(), CYTOSCAPE_MIN_JS (+11 more)

### Community 7 - "setup.tsx"
Cohesion: 0.15
Nodes (19): DownloadState, SetupScreen(), finish(), skip(), toggleConsent(), styles, formatBytes(), cloudConsentKey() (+11 more)

### Community 8 - "package.json"
Cohesion: 0.08
Nodes (23): main, name, private, version, babel-preset-expo, drizzle-orm, eslint, eslint-config-expo (+15 more)

### Community 9 - "settings.tsx"
Cohesion: 0.15
Nodes (21): selectModel(), DownloadState, formatHour(), SettingsScreen(), cancelDownload(), handleCloudConsentToggle(), loadModels(), removeKey() (+13 more)

### Community 10 - "openrouter.ts"
Cohesion: 0.14
Nodes (16): openModelPicker(), streamChat(), onDeviceChatStream(), buildBody(), buildHeaders(), ChatOpts, fetchModelCatalog(), normalizeModel() (+8 more)

### Community 11 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, babel-preset-expo, drizzle-orm, expo, expo-constants, expo-file-system, expo-linking, expo-local-authentication (+12 more)

### Community 12 - "index.tsx"
Cohesion: 0.18
Nodes (15): COLORS, ProfilesScreen(), handleCreate(), selectStudent(), styles, ProfileAvatar(), Props, styles (+7 more)

### Community 13 - "search.tsx"
Cohesion: 0.22
Nodes (13): SearchScreen(), styles, getAllTopics(), listChunks(), listSubjects(), RetrievedChunk, scoreBm25(), scoreCorpus() (+5 more)

### Community 14 - "ondevice.ts"
Cohesion: 0.17
Nodes (15): handleDeleteModel(), startDownload(), startDownload(), ActiveDownload, deleteModel(), downloadModel(), DownloadProgress, ensureModelsDir() (+7 more)

### Community 15 - "search.test.tsx"
Cohesion: 0.12
Nodes (13): @testing-library/react-native, mockParams, mockPush, mockReplace, mockResolve, mockStream, mockGetActiveStudentId, mockGetAllTopics (+5 more)

### Community 16 - "biometric.test.ts"
Cohesion: 0.20
Nodes (14): RootLayout(), handleUnlock(), handleBiometricToggle(), authenticateWithBiometrics(), getBiometricLockEnabled(), isBiometricAvailable(), setBiometricLockEnabled(), expo-local-authentication (+6 more)

### Community 17 - "notify.test.ts"
Cohesion: 0.20
Nodes (13): adjustHour(), handleReminderToggle(), cancelDailyReminder(), getReminderSettings(), requestNotificationPermission(), scheduleDailyReminder(), expo-notifications, mockCancel (+5 more)

### Community 18 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, drizzle-kit, eslint, eslint-config-expo, eslint-config-prettier, jest, jest-expo, prettier (+7 more)

### Community 19 - "prompts.ts"
Cohesion: 0.20
Nodes (12): Gap, Subject, buildGradeMessages(), buildTutorSystemPrompt(), Focus, masteryBand(), SubtopicProgressEntry, TONE_GUIDE (+4 more)

### Community 20 - "settings.test.tsx"
Cohesion: 0.23
Nodes (11): deleteApiKey(), getApiKey(), setApiKey(), storeKey(), mockGetKey, mockHasConsent, mockSetKey, mockValidate (+3 more)

### Community 21 - "progress.tsx"
Cohesion: 0.23
Nodes (9): BLOOM_NAMES, PHASE_LABELS, ProgressScreen(), styles, Summary, MasteryBar(), Props, styles (+1 more)

### Community 22 - "MarkdownText.tsx"
Cohesion: 0.23
Nodes (10): BlockToken, LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath(), sanitizeLatex(), Segment (+2 more)

### Community 23 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, android, format, ios, lint, start, test, test:watch (+2 more)

### Community 24 - "getActiveStudentId()"
Cohesion: 0.31
Nodes (7): switchProfile(), clearActiveStudentId(), getActiveStudentId(), setActiveStudentId(), mockDel, mockGet, mockSet

### Community 25 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 26 - "curriculum.ts"
Cohesion: 0.39
Nodes (6): BLOOM_LEVELS, bloomName(), SeedSubject, SeedTopic, SUBJECTS, TOPICS

### Community 27 - "adaptive.test.ts"
Cohesion: 0.25
Nodes (6): Mastery, mockGapsArr, mockMasteryMap, mockStudentsMap, mockTopicById, mockTopicsBySubject

### Community 28 - "Student"
Cohesion: 0.40
Nodes (3): Student, mockGetApiKey, mockGetStudent

### Community 29 - "Topic"
Cohesion: 0.40
Nodes (3): Topic, slugify(), uniqueSubjectId()

### Community 30 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

### Community 31 - "index.ts"
Cohesion: 0.50
Nodes (3): db, expo, expo-sqlite

### Community 32 - "eslint.config.js"
Cohesion: 0.50
Nodes (3): expoConfig, prettier, eslint-config-prettier

### Community 33 - "withReleaseRunScheme.js"
Cohesion: 0.50
Nodes (3): fs, path, { withDangerousMod }

## Knowledge Gaps
- **252 isolated node(s):** `mockRouter`, `mockIngestUrl`, `mockReplace`, `mockPush`, `mockParams` (+247 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 295 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `progress.tsx` to `quiz.tsx`, `ingest.tsx`, `learn.tsx`, `graph.tsx`, `setup.tsx`, `package.json`, `settings.tsx`, `index.tsx`, `search.tsx`, `search.test.tsx`, `settings.test.tsx`, `MarkdownText.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `react-native` connect `ingest.tsx` to `quiz.tsx`, `learn.tsx`, `graph.tsx`, `setup.tsx`, `package.json`, `settings.tsx`, `index.tsx`, `search.tsx`, `progress.tsx`, `MarkdownText.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `mockRouter`, `mockIngestUrl`, `mockReplace` to the rest of the system?**
  _252 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `quiz.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.054706163401815576 - nodes in this community are weakly interconnected._
- **Should `ingest.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06594071385359952 - nodes in this community are weakly interconnected._
- **Should `learn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._