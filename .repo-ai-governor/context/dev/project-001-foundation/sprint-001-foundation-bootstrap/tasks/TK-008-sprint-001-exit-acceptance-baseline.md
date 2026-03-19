# TK-008 sprint-001 出口验收基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-001-foundation`
- Sprint: `sprint-001-foundation-bootstrap`

## 1. 任务目标

对 sprint-001 交付进行统一验收并沉淀可复用出口基线、sprint-002 输入约束清单，以及 Artifact Registry 生命周期退出机制。

## 2. Depends On

1. `TK-004`
2. `TK-005`
3. `TK-006`
4. `TK-007`
5. `DA-003`
6. `DA-004`
7. `DA-007`
8. `DA-008`
9. `DA-009`
10. `DA-010`
11. `DA-011`

## 3. 预期产物

1. `DA-012` sprint-001 验收 baseline 文档。
2. `DA-013` 进入 sprint-002 的输入约束清单。
3. Artifact Registry 生命周期治理文档与门禁脚本落地（含主/归档注册表拆分）。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-004-monorepo-boundary-and-ci-baseline.md` (`DA-004`)
3. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-cli-skeleton-baseline.md` (`DA-007`)
4. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-shared-i18n-runtime-baseline.md` (`DA-008`)
5. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-command-smoke-checklist.md` (`DA-009`)
6. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-warning-gate-baseline.md` (`DA-010`)
7. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-whitelist-and-regression-policy.md` (`DA-011`)

## 5. 实施摘要

1. 完成 sprint-001 出口验收矩阵：
   - 验证 `apps/cli` 命令骨架与 shared i18n runtime 可用。
   - 验证 `pnpm run check` 全链路通过，并确认依赖边界 warning gate 已接线且违规计数为 0。
   - 验证任务台账与依赖产物注册链路一致（task card/checklist/tasks.csv + registry）。
2. 固化 sprint-002 输入约束：
   - 新增 `TK-008-sprint-002-input-constraints-checklist.md`，约束 TK-009~TK-012 的输入前置、验证命令与风险闸口。
3. 完成依赖回链：
   - 将 `DA-012/DA-013` 回链到 `TK-009/TK-010/TK-011/TK-012` 的 Depends On。
4. 落地 Artifact Registry 生命周期退出机制：
   - 新增生命周期治理文档 `artifact-registry-lifecycle-governance.md`。
   - 新增 `check-artifact-registry-lifecycle` 与 `compact-artifact-registry` 脚本并接入 `pnpm run check`。
   - 将 `DA-002` 从主注册表迁移到归档注册表，确保主上下文仅保留活跃产物。
5. 优化门禁执行编排与输出体验：
   - 引入 `turbo` 编排 `gate:*` 任务图，`pnpm run check` 由长命令链升级为 Turbo DAG 执行。
   - 各治理门禁脚本统一复用 `gate-output` 输出风格，提升可读性与失败定位效率。
6. 新增双模门禁入口：
   - 统一为 `check` 单入口，默认 `errors-only` 低噪音模式用于 AI 执行时节约 token。
   - 通过 `pnpm run check -- --verbose` 切换为 `full`，用于人工执行时查看全量细节。
   - 追加 Turbo 日志整形，将默认 `//:gate:*` 前缀统一美化为 `[turbo:gate:*]` 并保持 `--log-order=grouped` 可读性。

## 6. 产出

1. `DA-012` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-001-exit-acceptance-baseline.md`
2. `DA-013` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-002-input-constraints-checklist.md`
3. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
5. `.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`
6. `.repo-ai-governor/context/dev/index.md`
7. `.repo-ai-governor/normative_knowledge_sources/governance/artifact-registry-lifecycle-governance.md`
8. `scripts/governance/check-artifact-registry-lifecycle.js`
9. `scripts/governance/compact-artifact-registry.js`
10. `turbo.json`
11. `scripts/governance/gate-output.js`
12. `scripts/ci/gate-check-complete.js`
13. `package.json`
14. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 7. 验证

1. `pnpm run format:check && pnpm run lint && pnpm run build`
2. `node ./scripts/governance/check-package-dependency-boundary.js --mode warn --format json`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `pnpm run check`
5. `pnpm run check -- --verbose`
