# TK-029 sprint-001 出口验收与 sprint-002 输入约束

- Status: planned
- Date: 2026-03-20
- Owner: TBD
- Priority: P0
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-001-standards-pack-and-spec-sync`

## 1. 任务目标

形成 sprint-001 验收基线并沉淀 sprint-002 输入约束清单。

## 2. Depends On

1. `TK-024`
2. `TK-025`
3. `TK-026`
4. `DA-032`
5. `DA-033`
6. `DA-034`

## 3. 预期产物

1. `DA-035` sprint-001 standards/spec-sync exit acceptance baseline 文档。
2. `DA-036` sprint-002 slot/upgrade 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-024-standards-pack-registry-and-rule-renderer-baseline.md` (`DA-032`)
2. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-025-agents-projector-and-projection-parity-baseline.md` (`DA-033`)
3. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-026-spec-sync-guard-gate-integration-baseline.md` (`DA-034`)

## 5. 实施要点

1. 汇总验收矩阵并绑定证据路径。
2. 输出 sprint-002 启动前阻断项/确认项/自动项输入约束。
3. 同步 artifact registry 与 dev index 回链。

## 6. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `pnpm run check`
