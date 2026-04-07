# sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure 计划

- Status: active
- Date: 2026-04-06
- Project: `project-057-standards-native-review-engine-productization`
- Sprint Goal: 收口 standards-guided reviewer handoff、adapter-neutral projection 与 `review-verify` source-aware closure 语义。

## 1. Task Package

1. `TK-630` 定义 standards-guided reviewer handoff contract 与 adapter-neutral projection seam
2. `TK-631` 实现 review-verify source-aware closure semantics 与 rationale persistence
3. `TK-632` 集成 delegated CR loop projected rule loading 与 normalized finding ingestion

## 2. Exit Criteria

1. delegated reviewer request/output 已有结构化 contract，不再依赖 raw markdown-only prompt truth。
2. `review-verify` 能按 finding source type 处理 closure 语义。
3. delegated CR loop 与 native review engine 可以消费同一套 projected rule bundle 与 normalized finding model。

## 3. Milestones

1. 2026-04-06：作为 project-057 Phase C sprint 被创建，当前保持 `planned`。
2. 2026-04-07：在 `TK-647` 完成 sprint-002 closeout 后被激活为当前 primary sprint，`TK-630` 已切换为 `in_progress`。
