# Graph Report - adaptive-tutor-ios  (2026-11-02)

## Corpus Check
- 136 files · ~132,710 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .jsonl 1, .xcscheme 1)

## Summary
- 729 nodes · 1864 edges · 38 communities (34 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- learn.tsx
- ingest.tsx
- progress.tsx
- llm.ts
- data.ts
- package.json
- search.test.tsx
- expo
- graph.tsx
- setup.tsx
- dependencies
- SettingsScreen()
- voice.test.tsx
- gamify.ts
- adaptive.ts
- _layout.tsx
- settings.test.tsx
- settings.tsx
- SetupScreen()
- prompts.ts
- openrouter.ts
- MarkdownText.tsx
- expo
- scripts
- tsconfig.json
- curriculum.ts
- subtopic-nav.ts
- eslint.config.js
- expo-router
- index.ts
- Student
- Topic
- jest
- expo-sqlite

## God Nodes (most connected - your core abstractions)
1. `SettingsScreen()` - 44 edges
2. `LearnScreen()` - 42 edges
3. `getStudent()` - 33 edges
4. `react` - 25 edges
5. `VoiceScreen()` - 24 edges
6. `getActiveStudentId()` - 23 edges
7. `SetupScreen()` - 22 edges
8. `resolveLlmConfigById()` - 22 edges
9. `getTopic()` - 21 edges
10. `QuizScreen()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `adjustHour()` --calls--> `scheduleDailyReminder()`  [EXTRACTED]
  app/settings.tsx → lib/notify.ts
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts
- `KnowledgeMapScreen()` --calls--> `getMasteryMap()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts
- `KnowledgeMapScreen()` --calls--> `getStudent()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts

## Import Cycles
- None detected.

## Communities (38 total, 4 thin omitted)

### Community 0 - "learn.tsx"
Cohesion: 0.06
Nodes (87): BLOOM_NAMES, ChatBubble(), ChatMsg, LearnScreen(), loadRecentMessages(), markNextTaught(), onSend(), streamTutor() (+79 more)

### Community 1 - "ingest.tsx"
Cohesion: 0.08
Nodes (38): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+30 more)

### Community 2 - "progress.tsx"
Cohesion: 0.08
Nodes (38): COLORS, ProfilesScreen(), handleCreate(), selectStudent(), styles, BLOOM_NAMES, PHASE_LABELS, ProgressScreen() (+30 more)

### Community 3 - "llm.ts"
Cohesion: 0.08
Nodes (33): curriculumFormat, curriculumMessages(), generateCurriculumDraft(), parseCurriculumDraft(), setTopicSubtopics(), Subtopic, chatOnce(), ChatOpts (+25 more)

### Community 4 - "data.ts"
Cohesion: 0.08
Nodes (21): Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Message, messages, Session (+13 more)

### Community 5 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, drizzle-kit@^0.31.10, eslint@^9.39.4, jest@~29.7.0, jest-expo@~56.0.5, prettier@^3.8.4, @react-native/jest-preset@^0.86.0, react-test-renderer@^19.2.3 (+19 more)

### Community 6 - "search.test.tsx"
Cohesion: 0.14
Nodes (21): SearchScreen(), styles, getAllTopics(), listChunks(), listSubjects(), retrieveContext(), RetrievedChunk, scoreBm25() (+13 more)

### Community 7 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+18 more)

### Community 8 - "graph.tsx"
Cohesion: 0.13
Nodes (20): KnowledgeMapScreen(), styles, GRAPH_HTML, KnowledgeGraphView(), Props, styles, buildTopicGraph(), CYTOSCAPE_MIN_JS (+12 more)

### Community 9 - "setup.tsx"
Cohesion: 0.12
Nodes (22): startDownload(), DownloadState, startDownload(), styles, resolveLlmConfig(), ActiveDownload, downloadModel(), DownloadProgress (+14 more)

### Community 10 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, babel-preset-expo@~56.0.0, expo-constants@~56.0.18, expo-file-system@^56.0.8, expo-linking@~56.0.14, expo-local-authentication@~56.0.4, expo-notifications@~56.0.18, expo-secure-store@~56.0.4 (+18 more)

### Community 11 - "SettingsScreen()"
Cohesion: 0.16
Nodes (22): selectModel(), formatHour(), SettingsScreen(), adjustHour(), cancelDownload(), handleDeleteModel(), handleSpeakRepliesToggle(), loadModels() (+14 more)

### Community 12 - "voice.test.tsx"
Cohesion: 0.12
Nodes (17): stopLoop(), speakText(), speechFriendly(), stopSpeaking(), expo-speech, listeners, mockAbort, mockAddMessage (+9 more)

### Community 13 - "gamify.ts"
Cohesion: 0.17
Nodes (15): countClearedGaps(), countMasteredTopics(), grantAchievement(), listAchievements(), listTouchedSubjectIds(), buildSnapshot(), AchievementDef, ACHIEVEMENTS (+7 more)

### Community 14 - "adaptive.ts"
Cohesion: 0.16
Nodes (16): mastery, ApplyGradeResult, clamp(), NextStep, recommendStartTopic(), selectNextTopic(), deleteSubject(), deleteTopic() (+8 more)

### Community 15 - "_layout.tsx"
Cohesion: 0.18
Nodes (14): RootLayout(), handleUnlock(), styles, handleBiometricToggle(), authenticateWithBiometrics(), getBiometricLockEnabled(), isBiometricAvailable(), setBiometricLockEnabled() (+6 more)

### Community 16 - "settings.test.tsx"
Cohesion: 0.18
Nodes (13): removeKey(), deleteApiKey(), getApiKey(), setApiKey(), storeKey(), mockGetKey, mockHasConsent, mockSetKey (+5 more)

### Community 17 - "settings.tsx"
Cohesion: 0.21
Nodes (13): DownloadState, handleReminderToggle(), styles, cancelDailyReminder(), getReminderSettings(), requestNotificationPermission(), scheduleDailyReminder(), mockCancel (+5 more)

### Community 18 - "SetupScreen()"
Cohesion: 0.23
Nodes (13): handleCloudConsentToggle(), SetupScreen(), finish(), skip(), toggleConsent(), cloudConsentKey(), grantCloudConsent(), hasCloudConsent() (+5 more)

### Community 20 - "prompts.ts"
Cohesion: 0.20
Nodes (12): Gap, Mastery, buildGradeMessages(), buildTutorSystemPrompt(), Focus, masteryBand(), SubtopicProgressEntry, TONE_GUIDE (+4 more)

### Community 21 - "openrouter.ts"
Cohesion: 0.21
Nodes (10): openModelPicker(), ChatOpts, fetchModelCatalog(), normalizeModel(), OPENROUTER_BASE, OpenRouterModel, ORMessage, RawORModel (+2 more)

### Community 22 - "MarkdownText.tsx"
Cohesion: 0.24
Nodes (11): BlockToken, InlineText(), LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath(), sanitizeLatex() (+3 more)

### Community 23 - "expo"
Cohesion: 0.17
Nodes (7): expo@~56.0.12, { withEntitlementsPlist }, { withXcodeProject }, fs, path, { withDangerousMod }, expo

### Community 24 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android, format, ios, lint, metadata:pull, metadata:push, start (+4 more)

### Community 25 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 26 - "curriculum.ts"
Cohesion: 0.39
Nodes (6): BLOOM_LEVELS, bloomName(), SeedSubject, SeedTopic, SUBJECTS, TOPICS

### Community 27 - "subtopic-nav.ts"
Cohesion: 0.39
Nodes (6): allQuizzed(), findNextSubtopic(), ProgressMap, SubtopicItem, SubtopicProgressEntry, items

### Community 28 - "eslint.config.js"
Cohesion: 0.29
Nodes (6): expoConfig, prettier, eslint-config-expo@^56.0.4, eslint-config-prettier@^10.1.8, eslint-config-expo, eslint-config-prettier

### Community 29 - "expo-router"
Cohesion: 0.33
Nodes (4): ROW_STYLE, styles, expo-router@~56.2.11, expo-router

### Community 30 - "index.ts"
Cohesion: 0.40
Nodes (4): db, expo, drizzle-orm@^0.45.2, drizzle-orm

### Community 31 - "Student"
Cohesion: 0.40
Nodes (3): Student, mockGetApiKey, mockGetStudent

### Community 32 - "Topic"
Cohesion: 0.40
Nodes (3): Topic, slugify(), uniqueSubjectId()

### Community 33 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

### Community 34 - "expo-sqlite"
Cohesion: 0.33
Nodes (4): expo-sqlite@~56.0.5, react-native-screens@4.25.2, expo-sqlite, react-native-screens

## Knowledge Gaps
- **1 isolated node(s):** `expo/tsconfig.base`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 276 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `progress.tsx` to `learn.tsx`, `ingest.tsx`, `package.json`, `search.test.tsx`, `graph.tsx`, `setup.tsx`, `dependencies`, `voice.test.tsx`, `_layout.tsx`, `settings.test.tsx`, `settings.tsx`, `MarkdownText.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `learn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06164089347079038 - nodes in this community are weakly interconnected._
- **Why does `getStudent()` connect `learn.tsx` to `progress.tsx`, `llm.ts`, `data.ts`, `search.test.tsx`, `graph.tsx`, `setup.tsx`, `SettingsScreen()`, `voice.test.tsx`, `gamify.ts`, `settings.tsx`, `SetupScreen()`, `Student`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `ingest.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08418367346938775 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `progress.tsx` to `learn.tsx`, `ingest.tsx`, `package.json`, `search.test.tsx`, `graph.tsx`, `setup.tsx`, `dependencies`, `_layout.tsx`, `settings.tsx`, `MarkdownText.tsx`, `expo-router`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `progress.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07624113475177305 - nodes in this community are weakly interconnected._