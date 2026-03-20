# TK-030 project-003 出口验收与 project-004 输入约束

- Status: planned
- Date: 2026-03-20
- Owner: TBD
- Priority: P0
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-002-slot-security-and-upgrade-ux`

## 1. 任务目标

形成 project-003 统一验收基线并沉淀 project-004 输入约束清单。

## 2. Depends On

1. `TK-027`
2. `TK-028`
3. `DA-037`
4. `DA-038`

## 3. 预期产物

1. `DA-039` project-003 exit acceptance baseline 文档。
2. `DA-040` project-004 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-027-slot-engine-dual-track-and-script-security-baseline.md` (`DA-037`)
2. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-028-standards-upgrade-ux-and-version-pin-baseline.md` (`DA-038`)

## 5. 实施要点

1. 汇总 Stage 4 验收矩阵并绑定证据路径。
2. 输出 project-004 启动前阻断项/确认项/自动项输入约束。
3. 同步 artifact registry 与 dev index 回链。

## 6. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `pnpm run check`
