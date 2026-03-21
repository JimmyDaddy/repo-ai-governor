# TK-058 发布治理策略与 canary-rc-ga 通道基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-001-contract-and-release-governance-baseline`

## 1. 任务目标

固化 Stage 7 发布治理策略：lockstep + independent 版本边界、`canary -> rc -> ga` 通道、失败回退触发条件。

## 2. Depends On

1. `TK-056`
2. `TK-057`

## 3. 预期产物

1. `DA-069` 发布治理与通道策略基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.8`）
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 明确 lockstep（`core-*`、`adapter-sdk`、`shared`）与 independent（`adapters/*`、`providers/*`）发布边界。
2. 定义 canary/rc/ga 进入与退出标准及门禁依赖。
3. 定义回滚触发条件与最小审计证据要求。

## 6. 发布治理与通道基线（DA-069）

1. 发布治理规范落地：
   - 新增 `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`。
   - 在规范中固化 lockstep/independent 版本边界、`canary -> rc -> ga` 通道准入准出规则、回滚触发条件与最小审计证据。
2. 发布策略配置落地：
   - 新增 `scripts/release/release-governance-policy.json`，作为通道策略与证据要求的机器可读配置。
   - 新增 `scripts/release/runtime-js-whitelist.json`，约束运行时打包产物范围与必备入口文件。
3. 发布门禁脚本闭环：
   - 新增 `scripts/release/check-release-ready.js`，校验发布规范文档、策略配置、release 脚本与 `.release-it.json` hook 一致性。
   - 新增 `scripts/release/check-runtime-js-whitelist.js`，校验 `dist/{bin,apps,packages}` 运行时代码白名单与必备路径。
   - 新增 `scripts/release/verify-local-distribution.js`，执行 CLI help smoke 与 `pnpm pack --json` 产物完整性校验。
   - 新增 `scripts/release/render-release-notes.js`，按策略配置渲染渠道/回滚/证据模板。
4. GA 候选链路补齐：
   - 新增 `scripts/ci/check-coverage-thresholds.js` 与 `scripts/ci/coverage-thresholds.json`，补齐 `ci:quality` 的 coverage 阈值验证。
   - `.release-it.json` 的 `before:init` 从 `npm run release:ga-check` 切换为 `pnpm run release:ga-check`。
5. 发布构建稳定性修复：
   - `tsconfig.json` 与 `tsconfig.build.json` 增加 `apps/**/dist`、`packages/**/dist` 排除，避免包级 `dist` 递归编译污染分发目录。
   - `check-runtime-js-whitelist.js` 增加递归 `dist/dist` 异常检测，防止再次引入发布体积漂移。
6. 规范加载注册同步：
   - `normative-loading-manifest.yaml` 新增 `release_governance_spec` 条目并刷新 `generated_at`。
   - `long-term-maintenance-guide.md` 新增发布治理规范入口与 release cadence 命令对齐。

## 7. 验证

1. `pnpm run release:check`
2. `pnpm run release:ga-check`
3. `pnpm run check`
4. `node ./scripts/governance/reconcile-artifact-dependencies.js`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `in_progress`，开始补齐 Stage 7 发布治理规范、release 脚本闭环与 GA 候选验证链路。
3. 2026-03-22：完成 `DA-069` 发布治理基线、release/coverage 门禁脚本与规范加载注册同步；`release:check`、`release:ga-check`、`check` 全部通过，状态切换为 `completed`。

## 9. 产出

1. `DA-069` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-058-release-governance-and-canary-rc-ga-channel-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`
3. `scripts/release/release-governance-policy.json`
4. `scripts/release/runtime-js-whitelist.json`
5. `scripts/release/check-release-ready.js`
6. `scripts/release/check-runtime-js-whitelist.js`
7. `scripts/release/verify-local-distribution.js`
8. `scripts/release/render-release-notes.js`
9. `scripts/ci/check-coverage-thresholds.js`
10. `scripts/ci/coverage-thresholds.json`
11. `.release-it.json`
12. `tsconfig.json`
13. `tsconfig.build.json`
14. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
15. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
16. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
17. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/review/verified_review_tk-058-release-governance-and-canary-rc-ga-channel-baseline.md`
