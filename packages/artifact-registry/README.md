# @repo-ai-governor/artifact-registry

- Status: baseline
- Date: 2026-03-21
- Scope: `project-005-observability-and-artifacts / TK-048`

## Purpose

提供依赖产物注册与解析运行时基线，统一 `artifact_status` 生命周期校验、依赖表达式解析与 `block/escalate/warn` 处置语义。

## Baseline API

1. `ArtifactRegistry`
   - `registerArtifact(options)`
   - `listArtifacts(options?)`
   - `listArtifactVersions(artifactId)`
2. `ArtifactDependencyResolver`
   - `resolve(options)`
3. `InMemoryArtifactIndexStore`
   - `list()`
   - `upsert(record)`

## Notes

1. 默认可解析状态仅 `active/frozen`，`deprecated/archived/retired` 只保留登记语义，不进入自动依赖注入。
2. 依赖表达式支持 `artifactId`、`artifactId@vX.Y.Z` 与 `artifactId@^vX` 三种形态。
3. 解析输出内置审计字段，供后续 runtime/reporting 层直接回链消费。
