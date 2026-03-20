# TK-026 Spec Sync Guard 门禁接线基线

- Status: planned
- Date: 2026-03-20
- Owner: TBD
- Priority: P0
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-001-standards-pack-and-spec-sync`

## 1. 任务目标

将 Spec Sync Guard 纳入统一门禁链路，稳定输出 triad + brief 同步校验的阻断结果。

## 2. Depends On

1. `TK-024`
2. `TK-025`
3. `DA-032`
4. `DA-033`

## 3. 预期产物

1. `DA-034` spec sync guard gate integration baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-024-standards-pack-registry-and-rule-renderer-baseline.md` (`DA-032`)
2. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-025-agents-projector-and-projection-parity-baseline.md` (`DA-033`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2.5`）
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-015`）

## 5. 实施要点

1. 对接 triad + brief 变更识别与同步缺失判定。
2. 定义机器可读失败输出（`status/failures/changed_files/missing_sync_files`）。
3. 接入质量门禁并维持本地可读诊断提示。

## 6. 验证

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `pnpm run typecheck`
3. `pnpm run check`
