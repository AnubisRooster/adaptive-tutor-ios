# Graph Report - adaptive-tutor-ios  (2026-09-09)

## Corpus Check
- 124 files · ~304,860 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 651 nodes · 1537 edges · 37 communities (30 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- learn.tsx
- quiz.tsx
- llm.ts
- data.ts
- orchestrator.ts
- expo
- gamify.ts
- setup.tsx
- package.json
- adaptive.ts
- dependencies
- _layout.tsx
- settings.tsx
- ingest.test.ts
- ondevice.ts
- settings.test.tsx
- SettingsScreen()
- devDependencies
- graph.ts
- MarkdownText.tsx
- KnowledgeGraphView.tsx
- scripts
- uuid()
- subtopic-nav.ts
- tsconfig.json
- markSubtopicTaught()
- html.ts
- jest
- eslint.config.js
- withReleaseRunScheme.js
- graphify_pipeline.py
- drizzle-kit
- withoutPushEntitlement.js
- withoutScriptSandboxing.js

## God Nodes (most connected - your core abstractions)
1. `getStudent()` - 27 edges
2. `SettingsScreen()` - 25 edges
3. `LearnScreen()` - 22 edges
4. `getTopic()` - 21 edges
5. `react` - 20 edges
6. `resolveLlmConfigById()` - 18 edges
7. `getActiveStudentId()` - 16 edges
8. `listTopics()` - 15 edges
9. `chatOnce()` - 15 edges
10. `generateQuizQuestion()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `handleCreateCourse()` --indirect_call--> `createTopics()`  [INFERRED]
  app/ingest.tsx → lib/data.ts
- `removeKey()` --calls--> `deleteApiKey()`  [EXTRACTED]
  app/settings.tsx → lib/key-store.ts
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts
- `KnowledgeMapScreen()` --calls--> `getStudent()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts

## Import Cycles
- None detected.

## Communities (37 total, 4 thin omitted)

### Community 0 - "learn.tsx"
Cohesion: 0.06
Nodes (58): KnowledgeMapScreen(), styles, COLORS, ProfilesScreen(), handleCreate(), selectStudent(), styles, IngestScreen() (+50 more)

### Community 1 - "quiz.tsx"
Cohesion: 0.05
Nodes (59): Phase, QuizScreen(), nextQuestion(), startSession(), submitAnswer(), SCORE_COLOR(), SessionResult, styles (+51 more)

### Community 2 - "llm.ts"
Cohesion: 0.06
Nodes (50): handleCreateCourse(), refreshSubjects(), LearnScreen(), markNextTaught(), onSend(), openModelPicker(), streamTutor(), switchProfile() (+42 more)

### Community 3 - "data.ts"
Cohesion: 0.07
Nodes (22): db, expo, Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Message (+14 more)

### Community 4 - "orchestrator.ts"
Cohesion: 0.11
Nodes (25): BLOOM_LEVELS, bloomName(), SeedSubject, SeedTopic, SUBJECTS, TOPICS, Gap, createSubject() (+17 more)

### Community 5 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+18 more)

### Community 6 - "gamify.ts"
Cohesion: 0.16
Nodes (21): addXp(), countClearedGaps(), countMasteredTopics(), getStudent(), listAchievements(), listTouchedSubjectIds(), setStreak(), awardForGrade() (+13 more)

### Community 7 - "setup.tsx"
Cohesion: 0.14
Nodes (20): handleCloudConsentToggle(), DownloadState, SetupScreen(), finish(), skip(), toggleConsent(), styles, formatBytes() (+12 more)

### Community 8 - "package.json"
Cohesion: 0.08
Nodes (24): main, name, private, version, babel-preset-expo, drizzle-orm, eslint, eslint-config-expo (+16 more)

### Community 9 - "adaptive.ts"
Cohesion: 0.19
Nodes (17): applyGrade(), clamp(), NextStep, selectNextTopic(), addGap(), clearGapsForTopic(), deleteTopic(), getMastery() (+9 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, babel-preset-expo, drizzle-orm, expo, expo-constants, expo-file-system, expo-linking, expo-local-authentication (+12 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.18
Nodes (14): RootLayout(), handleUnlock(), styles, authenticateWithBiometrics(), getBiometricLockEnabled(), isBiometricAvailable(), setBiometricLockEnabled(), expo-local-authentication (+6 more)

### Community 12 - "settings.tsx"
Cohesion: 0.18
Nodes (15): DownloadState, adjustHour(), handleReminderToggle(), styles, cancelDailyReminder(), getReminderSettings(), requestNotificationPermission(), scheduleDailyReminder() (+7 more)

### Community 13 - "ingest.test.ts"
Cohesion: 0.20
Nodes (14): chunkText(), createSource(), insertKnowledgeChunk(), now(), touchStudent(), updateSource(), IngestProgress, ingestUrl() (+6 more)

### Community 14 - "ondevice.ts"
Cohesion: 0.16
Nodes (15): cancelDownload(), startDownload(), startDownload(), ActiveDownload, downloadModel(), DownloadProgress, ensureModelsDir(), getActiveDownload() (+7 more)

### Community 15 - "settings.test.tsx"
Cohesion: 0.20
Nodes (13): validateAndSave(), deleteApiKey(), getApiKey(), setApiKey(), storeKey(), validateApiKey(), mockGetKey, mockHasConsent (+5 more)

### Community 16 - "SettingsScreen()"
Cohesion: 0.18
Nodes (15): selectModel(), formatHour(), SettingsScreen(), handleBiometricToggle(), handleDeleteModel(), removeKey(), saveOrModel(), selectOndeviceModel() (+7 more)

### Community 17 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, drizzle-kit, eslint, eslint-config-expo, eslint-config-prettier, jest, jest-expo, prettier (+7 more)

### Community 18 - "graph.ts"
Cohesion: 0.24
Nodes (10): buildTopicGraph(), GraphEdge, GraphMasteryInput, GraphNode, GraphTopicInput, jsonEscape(), masteryBand, parsePrerequisites() (+2 more)

### Community 19 - "MarkdownText.tsx"
Cohesion: 0.23
Nodes (10): BlockToken, LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath(), sanitizeLatex(), Segment (+2 more)

### Community 20 - "KnowledgeGraphView.tsx"
Cohesion: 0.24
Nodes (7): GRAPH_HTML, KnowledgeGraphView(), Props, styles, CYTOSCAPE_MIN_JS, buildGraphHtml(), react-native-webview

### Community 21 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, android, format, ios, lint, start, test, test:watch (+2 more)

### Community 22 - "uuid()"
Cohesion: 0.22
Nodes (9): loadRecentMessages(), addMessage(), createStudent(), getOrCreateSession(), getRecentMessages(), grantAchievement(), hashPin(), uuid() (+1 more)

### Community 23 - "subtopic-nav.ts"
Cohesion: 0.33
Nodes (7): allQuizzed(), findNextSubtopic(), findNextToTeach(), ProgressMap, SubtopicItem, SubtopicProgressEntry, items

### Community 24 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 25 - "markSubtopicTaught()"
Cohesion: 0.29
Nodes (5): markSubtopicTaught(), parseProgress(), recomputePhase(), slugify(), uniqueSubjectId()

### Community 26 - "html.ts"
Cohesion: 0.67
Nodes (4): assertSafeUrl(), extractText(), fetchPageText(), PRIVATE_HOST_PATTERNS

### Community 27 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

### Community 28 - "eslint.config.js"
Cohesion: 0.50
Nodes (3): expoConfig, prettier, eslint-config-prettier

### Community 29 - "withReleaseRunScheme.js"
Cohesion: 0.50
Nodes (3): fs, path, { withDangerousMod }

## Knowledge Gaps
- **240 isolated node(s):** `mockRouter`, `mockIngestUrl`, `mockStream`, `mockResolve`, `mockList` (+235 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 282 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `learn.tsx` to `quiz.tsx`, `llm.ts`, `setup.tsx`, `package.json`, `_layout.tsx`, `settings.tsx`, `settings.test.tsx`, `MarkdownText.tsx`, `KnowledgeGraphView.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `react-native` connect `learn.tsx` to `quiz.tsx`, `setup.tsx`, `package.json`, `_layout.tsx`, `settings.tsx`, `MarkdownText.tsx`, `KnowledgeGraphView.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `mockRouter`, `mockIngestUrl`, `mockStream` to the rest of the system?**
  _240 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05997778600518327 - nodes in this community are weakly interconnected._
- **Should `quiz.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05368382080710848 - nodes in this community are weakly interconnected._
- **Should `llm.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05683563748079877 - nodes in this community are weakly interconnected._