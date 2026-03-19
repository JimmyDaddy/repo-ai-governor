# TK-004 Monorepo 边界与 CI 骨架基线

- Status: completed
- Date: 2026-03-19
- Owner: AI-Agent
- Priority: P0
- Project: `project-001-foundation`
- Sprint: `sprint-001-foundation-bootstrap`

## 1. 任务目标

完成 `apps/ + packages/` 边界落盘与 `integrations/ci` 骨架建立，形成可复用边界治理基线。

## 2. Depends On

1. `TK-003`
2. `DA-003`

## 3. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`

## 4. 实施摘要

1. 建立 `pnpm workspace` 边界基线：
   - 新增根级 `pnpm-workspace.yaml`，统一声明 `apps/*`、`packages/*`、`packages/*/*`。
   - 更新 `tsconfig.json` 与 `tsconfig.build.json`，移除根级 `src/**/*`，与“使用 `apps/ + packages/` 开发”约束对齐。
2. 建立 `integrations/ci` 骨架：
   - 新增 `integrations/ci/README.md`，定义 CI 模板目录与命令契约。
   - 新增 `integrations/ci/github-actions/quality-gate.yml`，提供标准质量门禁模板。
3. 回写任务治理链路：
   - 将本任务产物登记为 `DA-004` 并同步人类/机器 registry 索引。
   - 将后续任务（`TK-005`~`TK-008`）补充为可消费 `DA-004` 的依赖关系。

## 5. 产出

1. `pnpm-workspace.yaml`
2. `integrations/ci/README.md`
3. `integrations/ci/github-actions/quality-gate.yml`
4. `DA-004` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-004-monorepo-boundary-and-ci-baseline.md`

## 6. 验证

1. `pnpm-workspace.yaml` 已覆盖 `apps/` 与 `packages/` 及 provider 分组子目录。
2. CI 模板门禁命令与本地门禁保持一致：`pnpm run check`。
3. 本地质量门禁验证通过：`PATH=/opt/homebrew/bin:$PATH npm run check`。
