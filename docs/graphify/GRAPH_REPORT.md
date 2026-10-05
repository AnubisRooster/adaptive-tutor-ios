# Graph Report - adaptive-tutor-ios  (2026-10-05)

## Corpus Check
- 136 files · ~349,862 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .jsonl 1, .xcscheme 1)

## Summary
- 727 nodes · 1818 edges · 34 communities (28 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- quiz.tsx
- learn.tsx
- ingest.tsx
- LearnScreen()
- data.ts
- gamify.ts
- expo
- graph.tsx
- ingest.test.ts
- openrouter.ts
- settings.test.tsx
- settings.tsx
- SettingsScreen()
- setup.tsx
- dependencies
- package.json
- prompts.ts
- biometric.test.ts
- devDependencies
- adaptive.ts
- adaptive.test.ts
- scripts
- getMastery()
- subtopic-nav.ts
- tsconfig.json
- updateStudentOndeviceModel()
- eslint.config.js
- jest
- Topic
- drizzle-kit

## God Nodes (most connected - your core abstractions)
1. `SettingsScreen()` - 44 edges
2. `LearnScreen()` - 42 edges
3. `getStudent()` - 33 edges
4. `VoiceScreen()` - 24 edges
5. `react` - 24 edges
6. `getActiveStudentId()` - 23 edges
7. `SetupScreen()` - 22 edges
8. `resolveLlmConfigById()` - 22 edges
9. `getTopic()` - 21 edges
10. `QuizScreen()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `openModelPicker()` --calls--> `fetchModelCatalog()`  [EXTRACTED]
  app/learn.tsx → lib/openrouter.ts
- `handleCloudConsentToggle()` --calls--> `grantCloudConsent()`  [EXTRACTED]
  app/settings.tsx → lib/setup.ts
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts
- `KnowledgeMapScreen()` --calls--> `getStudent()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts

## Import Cycles
- None detected.

## Communities (34 total, 6 thin omitted)

### Community 0 - "quiz.tsx"
Cohesion: 0.06
Nodes (71): Phase, QuizScreen(), nextQuestion(), startSession(), submitAnswer(), SCORE_COLOR(), SessionResult, styles (+63 more)

### Community 1 - "learn.tsx"
Cohesion: 0.06
Nodes (54): COLORS, ProfilesScreen(), handleCreate(), selectStudent(), styles, styles, BLOOM_NAMES, ChatBubble() (+46 more)

### Community 2 - "ingest.tsx"
Cohesion: 0.07
Nodes (44): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+36 more)

### Community 3 - "LearnScreen()"
Cohesion: 0.07
Nodes (45): LearnScreen(), loadRecentMessages(), onSend(), openModelPicker(), streamTutor(), updateLastAssistant(), ChatBubble(), ChatMsg (+37 more)

### Community 4 - "data.ts"
Cohesion: 0.07
Nodes (25): db, expo, Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Message (+17 more)

### Community 5 - "gamify.ts"
Cohesion: 0.15
Nodes (23): addXp(), countClearedGaps(), countMasteredTopics(), grantAchievement(), listAchievements(), listTouchedSubjectIds(), setStreak(), awardForGrade() (+15 more)

### Community 6 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+18 more)

### Community 7 - "graph.tsx"
Cohesion: 0.12
Nodes (20): KnowledgeMapScreen(), styles, GRAPH_HTML, KnowledgeGraphView(), Props, styles, getMasteryMap(), buildTopicGraph() (+12 more)

### Community 8 - "ingest.test.ts"
Cohesion: 0.14
Nodes (19): chunkText(), createSource(), insertKnowledgeChunk(), updateSource(), assertSafeUrl(), extractText(), fetchPageText(), PRIVATE_HOST_PATTERNS (+11 more)

### Community 9 - "openrouter.ts"
Cohesion: 0.10
Nodes (17): buildBody(), buildHeaders(), ChatOpts, normalizeModel(), OPENROUTER_BASE, openrouterChatOnce(), openrouterChatStream(), OpenRouterModel (+9 more)

### Community 10 - "settings.test.tsx"
Cohesion: 0.13
Nodes (20): loadModels(), removeKey(), validateAndSave(), validateAndSave(), deleteApiKey(), getApiKey(), setApiKey(), storeKey() (+12 more)

### Community 11 - "settings.tsx"
Cohesion: 0.14
Nodes (20): DownloadState, formatHour(), handleDeleteModel(), startDownload(), styles, startDownload(), resolveLlmConfig(), ActiveDownload (+12 more)

### Community 12 - "SettingsScreen()"
Cohesion: 0.16
Nodes (20): SettingsScreen(), adjustHour(), cancelDownload(), handleCloudConsentToggle(), handleReminderToggle(), handleSpeakRepliesToggle(), updateStudentSpeakReplies(), cancelDailyReminder() (+12 more)

### Community 13 - "setup.tsx"
Cohesion: 0.17
Nodes (17): DownloadState, SetupScreen(), finish(), skip(), toggleConsent(), styles, cloudConsentKey(), grantCloudConsent() (+9 more)

### Community 14 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, babel-preset-expo, drizzle-orm, expo, expo-constants, expo-file-system, expo-linking, expo-local-authentication (+14 more)

### Community 15 - "package.json"
Cohesion: 0.10
Nodes (20): main, name, private, version, babel-preset-expo, eslint, expo-constants, expo-file-system (+12 more)

### Community 16 - "prompts.ts"
Cohesion: 0.19
Nodes (14): bloomName(), Gap, Mastery, Subject, buildGradeMessages(), buildTutorSystemPrompt(), Focus, masteryBand() (+6 more)

### Community 17 - "biometric.test.ts"
Cohesion: 0.21
Nodes (13): RootLayout(), handleUnlock(), handleBiometricToggle(), authenticateWithBiometrics(), getBiometricLockEnabled(), isBiometricAvailable(), setBiometricLockEnabled(), expo-local-authentication (+5 more)

### Community 19 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, drizzle-kit, eslint, eslint-config-expo, eslint-config-prettier, jest, jest-expo, prettier (+7 more)

### Community 20 - "adaptive.ts"
Cohesion: 0.26
Nodes (12): applyGrade(), ApplyGradeResult, clamp(), NextStep, recommendStartTopic(), selectNextTopic(), addGap(), clearGapsForTopic() (+4 more)

### Community 21 - "adaptive.test.ts"
Cohesion: 0.17
Nodes (8): Student, mockGapsArr, mockMasteryMap, mockStudentsMap, mockTopicById, mockTopicsBySubject, mockGetApiKey, mockGetStudent

### Community 22 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android, format, ios, lint, metadata:pull, metadata:push, start (+4 more)

### Community 23 - "getMastery()"
Cohesion: 0.38
Nodes (10): markNextTaught(), getMastery(), markSubtopicQuizzed(), markSubtopicTaught(), now(), parseProgress(), recomputePhase(), touchStudent() (+2 more)

### Community 24 - "subtopic-nav.ts"
Cohesion: 0.33
Nodes (7): allQuizzed(), findNextSubtopic(), findNextToTeach(), ProgressMap, SubtopicItem, SubtopicProgressEntry, items

### Community 25 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 26 - "updateStudentOndeviceModel()"
Cohesion: 0.29
Nodes (8): selectModel(), saveOrModel(), selectOndeviceModel(), switchProvider(), selectOndeviceModel(), updateStudentModel(), updateStudentOndeviceModel(), updateStudentProvider()

### Community 27 - "eslint.config.js"
Cohesion: 0.40
Nodes (4): expoConfig, prettier, eslint-config-expo, eslint-config-prettier

### Community 28 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

## Knowledge Gaps
- **269 isolated node(s):** `mockRouter`, `mockIngestUrl`, `mockReplace`, `mockPush`, `mockParams` (+264 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 325 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `learn.tsx` to `quiz.tsx`, `ingest.tsx`, `LearnScreen()`, `graph.tsx`, `settings.test.tsx`, `settings.tsx`, `setup.tsx`, `package.json`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `mockRouter`, `mockIngestUrl`, `mockReplace` to the rest of the system?**
  _269 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `quiz.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05720122574055159 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `learn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05662862159789289 - nodes in this community are weakly interconnected._
- **Why does `getStudent()` connect `quiz.tsx` to `learn.tsx`, `ingest.tsx`, `LearnScreen()`, `data.ts`, `gamify.ts`, `graph.tsx`, `settings.tsx`, `SettingsScreen()`, `setup.tsx`, `adaptive.test.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `ingest.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07080200501253132 - nodes in this community are weakly interconnected._