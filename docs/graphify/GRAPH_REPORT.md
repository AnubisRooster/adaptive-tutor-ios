# Graph Report - adaptive-tutor-ios  (2026-09-21)

## Corpus Check
- 136 files · ~347,699 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .jsonl 1, .xcscheme 1)

## Summary
- 727 nodes · 1807 edges · 35 communities (32 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- quiz.tsx
- learn.tsx
- graph.tsx
- progress.tsx
- ingest.tsx
- data.ts
- settings.tsx
- gamify.ts
- expo
- search.test.tsx
- setup.tsx
- package.json
- dependencies
- openrouter.ts
- settings.test.tsx
- graphify_pipeline.py
- devDependencies
- prompts.ts
- setup.ts
- MarkdownText.tsx
- scripts
- withReleaseRunScheme.js
- tsconfig.json
- curriculum.ts
- adaptive.test.ts
- subtopic-nav.ts
- updateStudentProvider()
- index.ts
- Student
- Topic
- eslint.config.js
- jest

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
- `openModelPicker()` --calls--> `fetchModelCatalog()`  [EXTRACTED]
  app/learn.tsx → lib/openrouter.ts
- `startDownload()` --calls--> `downloadModel()`  [EXTRACTED]
  app/settings.tsx → lib/ondevice.ts
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts
- `KnowledgeMapScreen()` --calls--> `getMasteryMap()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts

## Import Cycles
- None detected.

## Communities (35 total, 3 thin omitted)

### Community 0 - "quiz.tsx"
Cohesion: 0.06
Nodes (71): Phase, QuizScreen(), nextQuestion(), startSession(), submitAnswer(), SCORE_COLOR(), SessionResult, styles (+63 more)

### Community 1 - "learn.tsx"
Cohesion: 0.06
Nodes (68): BLOOM_NAMES, ChatMsg, LearnScreen(), loadRecentMessages(), markNextTaught(), onSend(), openModelPicker(), streamTutor() (+60 more)

### Community 2 - "graph.tsx"
Cohesion: 0.06
Nodes (39): KnowledgeMapScreen(), styles, RootLayout(), handleUnlock(), styles, ROW_STYLE, styles, handleBiometricToggle() (+31 more)

### Community 3 - "progress.tsx"
Cohesion: 0.07
Nodes (36): COLORS, ProfilesScreen(), handleCreate(), selectStudent(), styles, BLOOM_NAMES, PHASE_LABELS, styles (+28 more)

### Community 4 - "ingest.tsx"
Cohesion: 0.09
Nodes (36): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+28 more)

### Community 5 - "data.ts"
Cohesion: 0.08
Nodes (20): Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Message, messages, Session (+12 more)

### Community 6 - "settings.tsx"
Cohesion: 0.14
Nodes (26): DownloadState, formatHour(), SettingsScreen(), adjustHour(), cancelDownload(), handleDeleteModel(), handleReminderToggle(), handleSpeakRepliesToggle() (+18 more)

### Community 7 - "gamify.ts"
Cohesion: 0.15
Nodes (23): ProgressScreen(), addXp(), countClearedGaps(), countMasteredTopics(), listAchievements(), listTouchedSubjectIds(), setStreak(), awardForGrade() (+15 more)

### Community 8 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+18 more)

### Community 9 - "search.test.tsx"
Cohesion: 0.14
Nodes (20): SearchScreen(), styles, getAllTopics(), listChunks(), listSubjects(), RetrievedChunk, scoreBm25(), scoreCorpus() (+12 more)

### Community 10 - "setup.tsx"
Cohesion: 0.14
Nodes (21): DownloadState, SetupScreen(), startDownload(), styles, resolveLlmConfig(), ActiveDownload, downloadModel(), DownloadProgress (+13 more)

### Community 11 - "package.json"
Cohesion: 0.09
Nodes (21): main, name, private, version, babel-preset-expo, drizzle-kit, eslint, expo-constants (+13 more)

### Community 12 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, babel-preset-expo, drizzle-orm, expo, expo-constants, expo-file-system, expo-linking, expo-local-authentication (+14 more)

### Community 13 - "openrouter.ts"
Cohesion: 0.17
Nodes (17): loadModels(), validateAndSave(), buildBody(), buildHeaders(), ChatOpts, fetchModelCatalog(), normalizeModel(), OPENROUTER_BASE (+9 more)

### Community 14 - "settings.test.tsx"
Cohesion: 0.17
Nodes (14): removeKey(), deleteApiKey(), getApiKey(), setApiKey(), storeKey(), expo-secure-store, mockGetKey, mockHasConsent (+6 more)

### Community 15 - "graphify_pipeline.py"
Cohesion: 0.13
Nodes (13): graphify_analyze, graphify_build, graphify_cluster, graphify_detect, graphify_export, graphify_extract, graphify_llm, graphify_report (+5 more)

### Community 16 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, drizzle-kit, eslint, eslint-config-expo, eslint-config-prettier, jest, jest-expo, prettier (+7 more)

### Community 17 - "prompts.ts"
Cohesion: 0.20
Nodes (12): Gap, Subject, buildGradeMessages(), buildTutorSystemPrompt(), Focus, masteryBand(), SubtopicProgressEntry, TONE_GUIDE (+4 more)

### Community 18 - "setup.ts"
Cohesion: 0.23
Nodes (11): handleCloudConsentToggle(), finish(), skip(), toggleConsent(), cloudConsentKey(), grantCloudConsent(), hasCloudConsent(), markSetupDone() (+3 more)

### Community 19 - "MarkdownText.tsx"
Cohesion: 0.23
Nodes (10): BlockToken, LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath(), sanitizeLatex(), Segment (+2 more)

### Community 20 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android, format, ios, lint, metadata:pull, metadata:push, start (+4 more)

### Community 21 - "withReleaseRunScheme.js"
Cohesion: 0.18
Nodes (8): { withEntitlementsPlist }, { withXcodeProject }, fs, path, { withDangerousMod }, expo, ref_fs, ref_path

### Community 22 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 23 - "curriculum.ts"
Cohesion: 0.39
Nodes (6): BLOOM_LEVELS, bloomName(), SeedSubject, SeedTopic, SUBJECTS, TOPICS

### Community 24 - "adaptive.test.ts"
Cohesion: 0.25
Nodes (6): Mastery, mockGapsArr, mockMasteryMap, mockStudentsMap, mockTopicById, mockTopicsBySubject

### Community 25 - "subtopic-nav.ts"
Cohesion: 0.39
Nodes (6): allQuizzed(), findNextSubtopic(), ProgressMap, SubtopicItem, SubtopicProgressEntry, items

### Community 26 - "updateStudentProvider()"
Cohesion: 0.33
Nodes (7): selectModel(), saveOrModel(), switchProvider(), selectOndeviceModel(), validateAndSave(), updateStudentModel(), updateStudentProvider()

### Community 27 - "index.ts"
Cohesion: 0.40
Nodes (4): db, expo, drizzle-orm, expo-sqlite

### Community 28 - "Student"
Cohesion: 0.40
Nodes (3): Student, mockGetApiKey, mockGetStudent

### Community 29 - "Topic"
Cohesion: 0.40
Nodes (3): Topic, slugify(), uniqueSubjectId()

### Community 30 - "eslint.config.js"
Cohesion: 0.40
Nodes (4): expoConfig, prettier, eslint-config-expo, eslint-config-prettier

### Community 31 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

## Knowledge Gaps
- **269 isolated node(s):** `mockRouter`, `mockIngestUrl`, `mockReplace`, `mockPush`, `mockParams` (+264 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 328 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `progress.tsx` to `quiz.tsx`, `learn.tsx`, `graph.tsx`, `ingest.tsx`, `settings.tsx`, `search.test.tsx`, `setup.tsx`, `package.json`, `settings.test.tsx`, `MarkdownText.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `getStudent()` connect `quiz.tsx` to `learn.tsx`, `graph.tsx`, `progress.tsx`, `data.ts`, `settings.tsx`, `gamify.ts`, `search.test.tsx`, `setup.tsx`, `Student`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `mockRouter`, `mockIngestUrl`, `mockReplace` to the rest of the system?**
  _269 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `quiz.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05720122574055159 - nodes in this community are weakly interconnected._
- **Should `learn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06027306027306027 - nodes in this community are weakly interconnected._
- **Should `graph.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06108597285067873 - nodes in this community are weakly interconnected._