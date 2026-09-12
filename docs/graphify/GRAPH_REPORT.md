# Graph Report - adaptive-tutor-ios  (2026-09-12)

## Corpus Check
- 136 files · ~338,329 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 713 nodes · 1710 edges · 41 communities (34 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- quiz.tsx
- ingest.tsx
- voice.tsx
- data.ts
- getActiveStudentId()
- gamify.ts
- expo
- progress.tsx
- setup.tsx
- package.json
- dependencies
- react
- openrouter.ts
- adaptive.ts
- SettingsScreen()
- settings.tsx
- settings.test.tsx
- SetupScreen()
- biometric.test.ts
- devDependencies
- graph.ts
- getMastery()
- MarkdownText.tsx
- scripts
- learn.tsx
- profiles.test.tsx
- KnowledgeGraphView.tsx
- subtopic-nav.ts
- tsconfig.json
- learn.test.tsx
- Topic
- jest
- eslint.config.js
- withReleaseRunScheme.js
- graphify_pipeline.py
- drizzle-kit
- withoutPushEntitlement.js
- withoutScriptSandboxing.js

## God Nodes (most connected - your core abstractions)
1. `getStudent()` - 33 edges
2. `SettingsScreen()` - 26 edges
3. `react` - 24 edges
4. `LearnScreen()` - 22 edges
5. `getActiveStudentId()` - 22 edges
6. `getTopic()` - 21 edges
7. `listSubjects()` - 20 edges
8. `resolveLlmConfigById()` - 20 edges
9. `listTopics()` - 17 edges
10. `react-native` - 17 edges

## Surprising Connections (you probably didn't know these)
- `openModelPicker()` --calls--> `fetchModelCatalog()`  [EXTRACTED]
  app/learn.tsx → lib/openrouter.ts
- `removeKey()` --calls--> `deleteApiKey()`  [EXTRACTED]
  app/settings.tsx → lib/key-store.ts
- `startDownload()` --calls--> `downloadModel()`  [EXTRACTED]
  app/settings.tsx → lib/ondevice.ts
- `handleCloudConsentToggle()` --calls--> `grantCloudConsent()`  [EXTRACTED]
  app/settings.tsx → lib/setup.ts
- `startDownload()` --calls--> `downloadModel()`  [EXTRACTED]
  app/setup.tsx → lib/ondevice.ts

## Import Cycles
- None detected.

## Communities (41 total, 4 thin omitted)

### Community 0 - "quiz.tsx"
Cohesion: 0.05
Nodes (81): LearnScreen(), onSend(), openModelPicker(), streamTutor(), switchProfile(), updateLastAssistant(), Phase, QuizScreen() (+73 more)

### Community 1 - "ingest.tsx"
Cohesion: 0.07
Nodes (42): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+34 more)

### Community 2 - "voice.tsx"
Cohesion: 0.08
Nodes (32): loadRecentMessages(), ChatMsg, styles, VoiceScreen(), handleFinalUtterance(), loadRecent(), requestPermissions(), startListening() (+24 more)

### Community 3 - "data.ts"
Cohesion: 0.08
Nodes (20): db, expo, Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Message (+12 more)

### Community 4 - "getActiveStudentId()"
Cohesion: 0.11
Nodes (26): SearchScreen(), styles, getAllTopics(), listChunks(), listSubjects(), RetrievedChunk, scoreBm25(), scoreCorpus() (+18 more)

### Community 5 - "gamify.ts"
Cohesion: 0.15
Nodes (24): ProgressScreen(), addXp(), countClearedGaps(), countMasteredTopics(), getMasteryMap(), listAchievements(), listTouchedSubjectIds(), setStreak() (+16 more)

### Community 6 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+18 more)

### Community 7 - "progress.tsx"
Cohesion: 0.11
Nodes (21): BLOOM_NAMES, PHASE_LABELS, styles, Summary, bloomName(), Gap, Mastery, Student (+13 more)

### Community 8 - "setup.tsx"
Cohesion: 0.13
Nodes (21): handleDeleteModel(), DownloadState, styles, ActiveDownload, deleteModel(), downloadModel(), DownloadProgress, ensureModelsDir() (+13 more)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (23): main, name, private, version, babel-preset-expo, drizzle-orm, eslint, eslint-config-expo (+15 more)

### Community 10 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, babel-preset-expo, drizzle-orm, expo, expo-constants, expo-file-system, expo-linking, expo-local-authentication (+14 more)

### Community 11 - "react"
Cohesion: 0.15
Nodes (14): styles, COLORS, styles, styles, ROW_STYLE, styles, ProfileAvatar(), Props (+6 more)

### Community 12 - "openrouter.ts"
Cohesion: 0.19
Nodes (16): loadModels(), validateAndSave(), buildBody(), buildHeaders(), ChatOpts, fetchModelCatalog(), normalizeModel(), OPENROUTER_BASE (+8 more)

### Community 13 - "adaptive.ts"
Cohesion: 0.16
Nodes (16): applyGrade(), ApplyGradeResult, clamp(), NextStep, recommendStartTopic(), selectNextTopic(), clearGapsForTopic(), deleteSubject() (+8 more)

### Community 14 - "SettingsScreen()"
Cohesion: 0.14
Nodes (18): selectModel(), formatHour(), SettingsScreen(), cancelDownload(), handleCloudConsentToggle(), handleSpeakRepliesToggle(), removeKey(), saveOrModel() (+10 more)

### Community 15 - "settings.tsx"
Cohesion: 0.18
Nodes (15): DownloadState, adjustHour(), handleReminderToggle(), styles, cancelDailyReminder(), getReminderSettings(), requestNotificationPermission(), scheduleDailyReminder() (+7 more)

### Community 16 - "settings.test.tsx"
Cohesion: 0.18
Nodes (13): deleteApiKey(), getApiKey(), setApiKey(), storeKey(), expo-secure-store, mockGetKey, mockHasConsent, mockSetKey (+5 more)

### Community 17 - "SetupScreen()"
Cohesion: 0.22
Nodes (13): SetupScreen(), finish(), skip(), startDownload(), toggleConsent(), cloudConsentKey(), grantCloudConsent(), hasCloudConsent() (+5 more)

### Community 18 - "biometric.test.ts"
Cohesion: 0.21
Nodes (13): RootLayout(), handleUnlock(), handleBiometricToggle(), authenticateWithBiometrics(), getBiometricLockEnabled(), isBiometricAvailable(), setBiometricLockEnabled(), expo-local-authentication (+5 more)

### Community 19 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, drizzle-kit, eslint, eslint-config-expo, eslint-config-prettier, jest, jest-expo, prettier (+7 more)

### Community 20 - "graph.ts"
Cohesion: 0.23
Nodes (11): KnowledgeMapScreen(), buildTopicGraph(), GraphEdge, GraphMasteryInput, GraphNode, GraphTopicInput, jsonEscape(), masteryBand (+3 more)

### Community 21 - "getMastery()"
Cohesion: 0.27
Nodes (14): markNextTaught(), addGap(), addMessage(), createStudent(), getMastery(), grantAchievement(), markSubtopicQuizzed(), markSubtopicTaught() (+6 more)

### Community 22 - "MarkdownText.tsx"
Cohesion: 0.23
Nodes (10): BlockToken, LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath(), sanitizeLatex(), Segment (+2 more)

### Community 23 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android, format, ios, lint, metadata:pull, metadata:push, start (+4 more)

### Community 24 - "learn.tsx"
Cohesion: 0.20
Nodes (8): BLOOM_NAMES, ChatMsg, PHASE_LABELS, styles, MasteryBar(), Props, styles, OpenRouterModel

### Community 25 - "profiles.test.tsx"
Cohesion: 0.29
Nodes (9): ProfilesScreen(), handleCreate(), selectStudent(), hashPin(), listStudents(), verifyPin(), mockCreate, mockList (+1 more)

### Community 26 - "KnowledgeGraphView.tsx"
Cohesion: 0.28
Nodes (6): GRAPH_HTML, KnowledgeGraphView(), Props, styles, CYTOSCAPE_MIN_JS, buildGraphHtml()

### Community 27 - "subtopic-nav.ts"
Cohesion: 0.33
Nodes (7): allQuizzed(), findNextSubtopic(), findNextToTeach(), ProgressMap, SubtopicItem, SubtopicProgressEntry, items

### Community 28 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 29 - "learn.test.tsx"
Cohesion: 0.29
Nodes (5): mockParams, mockPush, mockReplace, mockResolve, mockStream

### Community 30 - "Topic"
Cohesion: 0.40
Nodes (3): Topic, slugify(), uniqueSubjectId()

### Community 31 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

### Community 32 - "eslint.config.js"
Cohesion: 0.50
Nodes (3): expoConfig, prettier, eslint-config-prettier

### Community 33 - "withReleaseRunScheme.js"
Cohesion: 0.50
Nodes (3): fs, path, { withDangerousMod }

## Knowledge Gaps
- **272 isolated node(s):** `mockRouter`, `mockIngestUrl`, `mockReplace`, `mockPush`, `mockParams` (+267 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 319 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `quiz.tsx`, `ingest.tsx`, `voice.tsx`, `getActiveStudentId()`, `progress.tsx`, `setup.tsx`, `package.json`, `settings.tsx`, `settings.test.tsx`, `MarkdownText.tsx`, `learn.tsx`, `profiles.test.tsx`, `KnowledgeGraphView.tsx`, `learn.test.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `getStudent()` connect `quiz.tsx` to `voice.tsx`, `data.ts`, `getActiveStudentId()`, `gamify.ts`, `progress.tsx`, `setup.tsx`, `react`, `SettingsScreen()`, `settings.tsx`, `SetupScreen()`, `graph.ts`, `learn.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `mockRouter`, `mockIngestUrl`, `mockReplace` to the rest of the system?**
  _272 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `quiz.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05176116838487973 - nodes in this community are weakly interconnected._
- **Should `ingest.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._
- **Should `voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07560975609756097 - nodes in this community are weakly interconnected._