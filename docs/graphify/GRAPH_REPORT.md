# Graph Report - adaptive-tutor-ios  (2026-09-07)

## Corpus Check
- 105 files · ~164,787 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 597 nodes · 1366 edges · 28 communities (21 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- quiz.tsx
- learn.tsx
- settings.tsx
- data.ts
- ingest.tsx
- openrouter.ts
- adaptive.test.ts
- gamify.ts
- package.json
- expo
- dependencies
- devDependencies
- graph.ts
- MarkdownText.tsx
- KnowledgeGraphView.tsx
- scripts
- tsconfig.json
- subtopic-nav.ts
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
3. `react` - 18 edges
4. `LearnScreen()` - 17 edges
5. `getTopic()` - 17 edges
6. `resolveLlmConfigById()` - 16 edges
7. `listTopics()` - 15 edges
8. `chatOnce()` - 15 edges
9. `now()` - 14 edges
10. `generateQuizQuestion()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `seedBuiltinCurriculum()`  [EXTRACTED]
  app/_layout.tsx → lib/seed.ts
- `handleUnlock()` --calls--> `authenticateWithBiometrics()`  [EXTRACTED]
  app/_layout.tsx → lib/biometric.ts
- `KnowledgeMapScreen()` --calls--> `getStudent()`  [EXTRACTED]
  app/graph.tsx → lib/data.ts
- `KnowledgeMapScreen()` --calls--> `buildTopicGraph()`  [EXTRACTED]
  app/graph.tsx → lib/graph.ts
- `KnowledgeMapScreen()` --calls--> `toCytoscapeJSON()`  [EXTRACTED]
  app/graph.tsx → lib/graph.ts

## Import Cycles
- None detected.

## Communities (28 total, 4 thin omitted)

### Community 0 - "quiz.tsx"
Cohesion: 0.06
Nodes (72): Phase, QuizScreen(), submitAnswer(), SCORE_COLOR(), styles, applyGrade(), ApplyGradeResult, clamp() (+64 more)

### Community 1 - "learn.tsx"
Cohesion: 0.06
Nodes (53): KnowledgeMapScreen(), styles, COLORS, styles, BLOOM_NAMES, ChatMsg, LearnScreen(), loadRecentMessages() (+45 more)

### Community 2 - "settings.tsx"
Cohesion: 0.06
Nodes (56): RootLayout(), handleUnlock(), styles, selectModel(), DownloadState, formatHour(), SettingsScreen(), adjustHour() (+48 more)

### Community 3 - "data.ts"
Cohesion: 0.05
Nodes (40): ProfilesScreen(), handleCreate(), selectStudent(), db, expo, Achievement, achievements, gaps (+32 more)

### Community 4 - "ingest.tsx"
Cohesion: 0.08
Nodes (40): IngestScreen(), handleCreateCourse(), handleIngest(), handleProgress(), refreshSubjects(), selectSubject(), styles, Tab (+32 more)

### Community 5 - "openrouter.ts"
Cohesion: 0.09
Nodes (31): openModelPicker(), loadModels(), removeKey(), validateAndSave(), deleteApiKey(), getApiKey(), setApiKey(), storeKey() (+23 more)

### Community 6 - "adaptive.test.ts"
Cohesion: 0.10
Nodes (23): BLOOM_LEVELS, bloomName(), SeedSubject, SeedTopic, SUBJECTS, TOPICS, Gap, buildGradeMessages() (+15 more)

### Community 7 - "gamify.ts"
Cohesion: 0.15
Nodes (23): addXp(), countClearedGaps(), countMasteredTopics(), grantAchievement(), listAchievements(), listTouchedSubjectIds(), setStreak(), awardForGrade() (+15 more)

### Community 8 - "package.json"
Cohesion: 0.08
Nodes (23): main, name, private, version, babel-preset-expo, drizzle-orm, eslint, eslint-config-expo (+15 more)

### Community 9 - "expo"
Cohesion: 0.09
Nodes (22): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+14 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, babel-preset-expo, drizzle-orm, expo, expo-constants, expo-file-system, expo-linking, expo-local-authentication (+12 more)

### Community 11 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, drizzle-kit, eslint, eslint-config-expo, eslint-config-prettier, jest, jest-expo, prettier (+7 more)

### Community 12 - "graph.ts"
Cohesion: 0.24
Nodes (10): buildTopicGraph(), GraphEdge, GraphMasteryInput, GraphNode, GraphTopicInput, jsonEscape(), masteryBand, parsePrerequisites() (+2 more)

### Community 13 - "MarkdownText.tsx"
Cohesion: 0.23
Nodes (10): BlockToken, LATEX_SYMBOLS, MarkdownText(), MarkdownTextProps, parseInline(), preprocessMath(), sanitizeLatex(), Segment (+2 more)

### Community 14 - "KnowledgeGraphView.tsx"
Cohesion: 0.24
Nodes (7): GRAPH_HTML, KnowledgeGraphView(), Props, styles, CYTOSCAPE_MIN_JS, buildGraphHtml(), react-native-webview

### Community 15 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, android, format, ios, lint, start, test, test:watch (+2 more)

### Community 16 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, exclude, extends, include

### Community 17 - "subtopic-nav.ts"
Cohesion: 0.39
Nodes (6): allQuizzed(), findNextSubtopic(), ProgressMap, SubtopicItem, SubtopicProgressEntry, items

### Community 18 - "jest"
Cohesion: 0.40
Nodes (5): jest, moduleNameMapper, preset, setupFilesAfterEnv, transformIgnorePatterns

### Community 19 - "eslint.config.js"
Cohesion: 0.50
Nodes (3): expoConfig, prettier, eslint-config-prettier

### Community 20 - "withReleaseRunScheme.js"
Cohesion: 0.50
Nodes (3): fs, path, { withDangerousMod }

## Knowledge Gaps
- **220 isolated node(s):** `mockRouter`, `mockIngestUrl`, `mockStream`, `mockResolve`, `mockList` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 259 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `learn.tsx` to `quiz.tsx`, `settings.tsx`, `data.ts`, `ingest.tsx`, `openrouter.ts`, `package.json`, `MarkdownText.tsx`, `KnowledgeGraphView.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `mockRouter`, `mockIngestUrl`, `mockStream` to the rest of the system?**
  _220 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `quiz.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05721003134796238 - nodes in this community are weakly interconnected._
- **Should `learn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0649692712906058 - nodes in this community are weakly interconnected._
- **Should `settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.058653846153846154 - nodes in this community are weakly interconnected._