# Graph Report - adaptive-tutor-ios  (2026-10-26)

## Corpus Check
- 136 files · ~132,386 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .jsonl 1, .xcscheme 1)

## Summary
- 720 nodes · 1846 edges · 36 communities (31 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- learn.tsx
- llm.ts
- ingest.tsx
- gamify.ts
- data.ts
- react
- react-native
- search.test.tsx
- expo
- setup.tsx
- package.json
- dependencies
- settings.test.tsx
- voice.test.tsx
- progress.tsx
- settings.tsx
- SetupScreen()
- MarkdownText.tsx
- graph.ts
- adaptive.ts
- scripts
- graph.tsx
- updateStudentOndeviceModel()
- KnowledgeGraphView.tsx
- notify.test.ts
- tsconfig.json
- adaptive.test.ts
- subtopic-nav.ts
- Topic
- eslint-config-expo
- jest
- drizzle-kit

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
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts
- `KnowledgeMapScreen()` --calls--> `getStudent()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts
- `KnowledgeMapScreen()` --calls--> `listSubjects()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts
- `KnowledgeMapScreen()` --calls--> `buildTopicGraph()`  [EXTRACTED]
  app/graph.tsx → lib/graph.ts

## Import Cycles
- None detected.

## Communities (36 total, 5 thin omitted)

### Community 0 - "learn.tsx"
Cohesion: 0.09
Nodes (63): BLOOM_NAMES, ChatBubble(), ChatMsg, LearnScreen(), loadRecentMessages(), markNextTaught(), onSend(), streamTutor() (+55 more)

### Community 1 - "llm.ts"
Cohesion: 0.05
Nodes (47): openModelPicker(), curriculumFormat, curriculumMessages(), generateCurriculumDraft(), parseCurriculumDraft(), setTopicSubtopics(), Subtopic, gradeFormat (+39 more)

### Community 2 - "ingest.tsx"
Cohesion: 0.07
Nodes (43): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+35 more)

### Community 3 - "gamify.ts"
Cohesion: 0.09
Nodes (34): ProgressScreen(), addXp(), countClearedGaps(), countMasteredTopics(), grantAchievement(), listAchievements(), listTouchedSubjectIds(), setStreak() (+26 more)

### Community 4 - "data.ts"
Cohesion: 0.08
Nodes (21): db, expo, Achievement, achievements, gaps, KnowledgeChunk, knowledgeChunks, Message (+13 more)

### Community 5 - "react"
Cohesion: 0.10
Nodes (28): COLORS, ProfilesScreen(), handleCreate(), selectStudent(), styles, ProfileAvatar(), Props, styles (+20 more)

### Community 6 - "react-native"
Cohesion: 0.09
Nodes (23): RootLayout(), handleUnlock(), styles, ROW_STYLE, styles, handleBiometricToggle(), Props, styles (+15 more)

### Community 7 - "search.test.tsx"
Cohesion: 0.14
Nodes (21): SearchScreen(), styles, getAllTopics(), listChunks(), listSubjects(), retrieveContext(), RetrievedChunk, scoreBm25() (+13 more)

### Community 8 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+18 more)

### Community 9 - "setup.tsx"
Cohesion: 0.13
Nodes (22): startDownload(), DownloadState, startDownload(), styles, ActiveDownload, deleteModel(), downloadModel(), DownloadProgress (+14 more)

### Community 10 - "package.json"
Cohesion: 0.11
Nodes (25): devDependencies, eslint@^9.39.4, jest@~29.7.0, jest-expo@~56.0.5, prettier@^3.8.4, @react-native/jest-preset@^0.86.0, react-test-renderer@^19.2.3, test-renderer@^1.2.0 (+17 more)

### Community 11 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, babel-preset-expo@~56.0.0, expo-constants@~56.0.18, expo-file-system@^56.0.8, expo-linking@~56.0.14, expo-router@~56.2.11, expo-secure-store@~56.0.4, expo-speech@~56.0.3 (+16 more)

### Community 12 - "settings.test.tsx"
Cohesion: 0.13
Nodes (16): removeKey(), deleteApiKey(), getApiKey(), setApiKey(), storeKey(), resolveLlmConfig(), mockGetKey, mockHasConsent (+8 more)

### Community 13 - "voice.test.tsx"
Cohesion: 0.12
Nodes (17): stopLoop(), speakText(), speechFriendly(), stopSpeaking(), expo-speech, listeners, mockAbort, mockAddMessage (+9 more)

### Community 14 - "progress.tsx"
Cohesion: 0.14
Nodes (18): BLOOM_NAMES, PHASE_LABELS, styles, Summary, bloomName(), Mastery, Student, Subject (+10 more)

### Community 15 - "settings.tsx"
Cohesion: 0.22
Nodes (18): DownloadState, formatHour(), SettingsScreen(), adjustHour(), cancelDownload(), handleReminderToggle(), handleSpeakRepliesToggle(), loadModels() (+10 more)

### Community 16 - "SetupScreen()"
Cohesion: 0.23
Nodes (13): handleCloudConsentToggle(), SetupScreen(), finish(), skip(), toggleConsent(), cloudConsentKey(), grantCloudConsent(), hasCloudConsent() (+5 more)

### Community 18 - "MarkdownText.tsx"
Cohesion: 0.22
Nodes (12): ChatBubble(), BlockToken, InlineText(), LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath() (+4 more)

### Community 19 - "graph.ts"
Cohesion: 0.24
Nodes (10): buildTopicGraph(), GraphEdge, GraphMasteryInput, GraphNode, GraphTopicInput, jsonEscape(), masteryBand, parsePrerequisites() (+2 more)

### Community 20 - "adaptive.ts"
Cohesion: 0.32
Nodes (11): applyGrade(), ApplyGradeResult, clamp(), NextStep, addGap(), clearGapsForTopic(), markSubtopicQuizzed(), now() (+3 more)

### Community 21 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android, format, ios, lint, metadata:pull, metadata:push, start (+4 more)

### Community 22 - "graph.tsx"
Cohesion: 0.29
Nodes (10): KnowledgeMapScreen(), styles, KnowledgeGraphView(), recommendStartTopic(), selectNextTopic(), deleteSubject(), deleteTopic(), getMasteryMap() (+2 more)

### Community 23 - "updateStudentOndeviceModel()"
Cohesion: 0.24
Nodes (10): selectModel(), handleDeleteModel(), saveOrModel(), selectOndeviceModel(), switchProvider(), selectOndeviceModel(), validateAndSave(), updateStudentModel() (+2 more)

### Community 24 - "KnowledgeGraphView.tsx"
Cohesion: 0.24
Nodes (7): GRAPH_HTML, Props, styles, CYTOSCAPE_MIN_JS, buildGraphHtml(), react-native-webview@13.16.1, react-native-webview

### Community 25 - "notify.test.ts"
Cohesion: 0.22
Nodes (8): expo-notifications@~56.0.18, expo-notifications, mockCancel, mockGetItem, mockGetPerms, mockRequestPerms, mockSchedule, mockSetItem

### Community 26 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 27 - "adaptive.test.ts"
Cohesion: 0.25
Nodes (6): Gap, mockGapsArr, mockMasteryMap, mockStudentsMap, mockTopicById, mockTopicsBySubject

### Community 28 - "subtopic-nav.ts"
Cohesion: 0.39
Nodes (6): allQuizzed(), findNextSubtopic(), ProgressMap, SubtopicItem, SubtopicProgressEntry, items

### Community 29 - "Topic"
Cohesion: 0.33
Nodes (4): Topic, recomputePhase(), slugify(), uniqueSubjectId()

### Community 30 - "eslint-config-expo"
Cohesion: 0.40
Nodes (4): eslint-config-expo@^56.0.4, eslint-config-prettier@^10.1.8, eslint-config-expo, eslint-config-prettier

### Community 31 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

## Knowledge Gaps
- **1 isolated node(s):** `expo/tsconfig.base`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 271 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `learn.tsx`, `ingest.tsx`, `gamify.ts`, `react-native`, `search.test.tsx`, `setup.tsx`, `package.json`, `dependencies`, `settings.test.tsx`, `voice.test.tsx`, `progress.tsx`, `settings.tsx`, `MarkdownText.tsx`, `graph.tsx`, `KnowledgeGraphView.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `learn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08732394366197183 - nodes in this community are weakly interconnected._
- **Why does `getStudent()` connect `learn.tsx` to `llm.ts`, `gamify.ts`, `data.ts`, `search.test.tsx`, `setup.tsx`, `settings.test.tsx`, `voice.test.tsx`, `progress.tsx`, `settings.tsx`, `SetupScreen()`, `graph.tsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `llm.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05268065268065268 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `learn.tsx`, `ingest.tsx`, `react`, `search.test.tsx`, `setup.tsx`, `package.json`, `progress.tsx`, `settings.tsx`, `MarkdownText.tsx`, `graph.tsx`, `KnowledgeGraphView.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `ingest.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07337662337662337 - nodes in this community are weakly interconnected._