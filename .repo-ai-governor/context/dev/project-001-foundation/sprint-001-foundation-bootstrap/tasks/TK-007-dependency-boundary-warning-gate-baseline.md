# TK-007 依赖边界 warning gate 基线

- Status: completed
- Date: 2026-03-19
- Owner: AI-Agent
- Priority: P0
- Project: `project-001-foundation`
- Sprint: `sprint-001-foundation-bootstrap`

## 1. 任务目标

接入 `scripts/governance/check-package-dependency-boundary.js` 并以 warning 模式运行，形成可持续清零、可回归、可切换 blocking 的依赖边界门禁基线。

## 2. Depends On

1. `TK-004`
2. `DA-003`
3. `DA-004`
4. `DA-007`
5. `DA-008`

## 3. 预期产物

1. `DA-010` warning gate 基线策略文档。
2. `DA-011` 白名单与回归准入说明文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-004-monorepo-boundary-and-ci-baseline.md` (`DA-004`)
3. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-cli-skeleton-baseline.md` (`DA-007`)
4. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-shared-i18n-runtime-baseline.md` (`DA-008`)
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§6` 与 `§6.1`）

## 5. 实施摘要

1. 新增依赖边界检查脚本：
   - 新建 `scripts/governance/check-package-dependency-boundary.js`。
   - 基于 workspace 包根目录自动识别依赖边界，输出 source/target/package/rule 级别违规信息。
   - 支持 `--mode warn|block` 与 `--format text|json`，为后续切换 blocking 保留兼容入口。
2. 新增白名单基线：
   - 新建 `scripts/governance/dependency-boundary-whitelist.json`。
   - 默认空白名单，要求仅在“必须兼容窗口”下登记 `from/to/reason`。
3. 接入 warning gate：
   - `package.json` 新增 `check:dependency-boundary:warn` 与 `check:dependency-boundary:block`。
   - 将 warning 命令纳入 `pnpm run check`，保持“报警不阻断”。
4. 同步规范入口：
   - 在 `code_standards.md -> Verification Commands` 中加入 warning gate 命令。
   - 在 `long-term-maintenance-guide.md` 中明确“warning 已启用、blocking 待切换”的运行策略。

## 6. 产出

1. `scripts/governance/check-package-dependency-boundary.js`
2. `scripts/governance/dependency-boundary-whitelist.json`
3. `package.json`（`check:*dependency-boundary*` 命令接线）
4. `scripts/governance/check-code-standards.js`（标准文档标记守卫扩展）
5. `DA-010` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-warning-gate-baseline.md`
6. `DA-011` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-whitelist-and-regression-policy.md`

## 7. 验证

1. `node ./scripts/governance/check-package-dependency-boundary.js --mode warn`
2. `node ./scripts/governance/check-package-dependency-boundary.js --mode warn --format json`
3. `pnpm run check`
