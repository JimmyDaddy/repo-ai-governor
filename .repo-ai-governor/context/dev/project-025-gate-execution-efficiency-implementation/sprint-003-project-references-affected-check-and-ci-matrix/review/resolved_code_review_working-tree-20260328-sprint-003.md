# Code Review: sprint-003 — TS project references, affected planner, CI matrix 与 project-025 closeout

- Status: resolved
- Date: 2026-03-28
- Reviewer: AI-Agent
- Task: `TK-286 / TK-287 / TK-288`
- Review Type: working tree review
- Normative References:
  - `governance/code_standards.md` (ESM 显式扩展名、标准化错误、接口规范)
  - `CLAUDE.md` (架构分层、测试拓扑、构建约定)
  - `repo-ai-governor-overall-technical-solution.md` (runtime contracts)

## 1. Review Scope

1. `packages/shared/tsconfig.build.json`
2. `packages/memory-store-adapter/tsconfig.build.json`
3. `packages/core-memory/tsconfig.build.json`
4. `packages/core-memory-semantics/tsconfig.build.json`
5. `tsconfig.package-local-pilot.build.json`（新增）
6. `scripts/ci/run-affected-check.js`（新增）
7. `scripts/ci/run-gate-check.js`
8. `.github/workflows/quality-gate.yml`
9. `package.json`
10. `test/gate-runner-output.integration.test.ts`
11. 上下文 / 任务文档（sprint-003 plan / checklist / tasks.csv / TK-286 / TK-287 / TK-288 / project-025 plan / current-context / completed-streams-history / delivery-registry / master-execution-plan / completion-audit-summary）

## 2. Findings

### 2.1 [P1] `run-affected-check.js` — `spawnSync` 同步执行可能在大型 gate 组合中阻塞 Node.js event loop

- 位置: `scripts/ci/run-affected-check.js:runCommand`
- 问题描述: `runCommand` 使用 `spawnSync` 同步执行每个 gate 命令（如 `check:fast` → `check:package-local:pilot:incremental` → `check:package-local:pilot`），意味着三个命令是严格串行执行。这本身在 `affected` 场景下语义正确（需要顺序验证），但 `spawnSync` 会完全阻塞主进程直到子进程退出，在 `pretty` 模式下 `stdio: "inherit"` 可以正常透传输出，但在 `json` 模式下所有 stdout/stderr 都被缓冲到内存（`encoding: "utf8"` + `pipe`），若 `check:full` fallback 产生大量输出可能导致内存压力。
- 影响: 低—当前 affected planner 的 command plan 最多 3 条命令，实际产出不大；但 `full_fallback` 路径的 `check:full` 可能产出数十 KB 日志。
- 建议: 当前实现可接受；若后续扩展到更多命令或更大输出量，考虑切换到异步 `spawn` + stream capture 模式。

### 2.2 [P2] `run-affected-check.js` — `DOC_ONLY_PREFIXES` 覆盖面可能不够完整

- 位置: `scripts/ci/run-affected-check.js:DOC_ONLY_PREFIXES`
- 问题描述: 当前 doc-only 前缀列表为 `.repo-ai-governor/`、`AGENTS.md`、`CLAUDE.md`、`README.md`、`README.zh-CN.md`。但仓库中还存在其他纯文档文件（如 `.codex/` 目录下的 `SKILL.md` 文件、`LICENSE`、`CHANGELOG.md`），这些变更也不需要触发代码 gate。如果只改了 `.codex/skills/*/SKILL.md`，当前会走 `full_fallback`。
- 影响: 低—影响的是 affected 检测精度，不影响正确性（full 是安全回退）。
- 建议: 考虑扩充 `DOC_ONLY_PREFIXES` 以覆盖 `.codex/`、`docs/`、`LICENSE`、`CHANGELOG.md` 等纯文档路径；或采用反向策略（只有匹配特定代码路径时才走非 fast 模式）。

### 2.3 [P2] `run-affected-check.js` — `PACKAGE_LOCAL_PILOT_PREFIXES` 硬编码了 4 个 pilot 包路径

- 位置: `scripts/ci/run-affected-check.js:PACKAGE_LOCAL_PILOT_PREFIXES` 和 `PACKAGE_LOCAL_PILOT_FILES`
- 问题描述: pilot 包的路径列表是硬编码的常量。如果后续将更多 package 加入 package-local pilot（如 `packages/reporting/`、`packages/config/` 等），需要同时更新 `run-affected-check.js`、`tsconfig.package-local-pilot.build.json` 和 `package.json` 中的 `check:package-local:pilot` filter——三处同步。
- 影响: 中—pilot 扩围时容易遗漏同步点，导致 affected planner 误判。
- 建议: 考虑将 pilot 包列表提取到单一 source-of-truth（如 `turbo.json` 中的 filter 或一个共享配置文件），由 `run-affected-check.js` 和 `tsconfig.package-local-pilot.build.json` 自动消费。当前作为 sprint-003 首版实现可接受，但建议在后续扩围时作为首要改进项。

### 2.4 [P2] `quality-gate.yml` — `quality-gate-fast-affected` 和 `quality-gate-full` 重复了 checkout/setup/install 步骤

- 位置: `.github/workflows/quality-gate.yml`
- 问题描述: CI matrix 分成了两个 job（`quality-gate-fast-affected` 和 `quality-gate-full`），但两个 job 都需要完整的 checkout → pnpm setup → node setup → install 流程，每次 CI 运行要重复 3 次（fast + affected + full）。这增加了 CI 总耗时和 GitHub Actions 用量。
- 影响: 中—每次 CI 多出约 30-60s 的重复 setup 开销。但 `fail-fast: false` 确保 fast/affected 可以并行运行，且 full 是独立的权威入口。
- 建议: 考虑将 3 个 profile 合并到同一个 matrix job 中（`matrix: { profile: [fast, affected, full] }`），减少重复 setup。注意 `full` 当前是独立 job 可能是有意为之（独立的权威入口），如果这是设计意图则保持现状并在注释中说明。

### 2.5 [P3] `tsconfig.build.json` — 4 个包的 `composite` + `declaration` 启用但根配置 `tsconfig.build.json` 未声明 `composite`

- 位置: `packages/*/tsconfig.build.json` extends `../../tsconfig.build.json`
- 问题描述: 4 个 package 的 `tsconfig.build.json` 各自声明了 `composite: true, incremental: true, declaration: true`。这些选项在 `extends` 链中会覆盖基础配置。根配置 `tsconfig.build.json` 本身不需要 `composite`（因为它不是一个被引用的 project），所以当前做法是正确的。但如果未来有人在根 `tsconfig.build.json` 中设置了 `composite: false`，子包的 override 会被忽略（`extends` 中 `compilerOptions` 是合并而非替换）。
- 影响: 极低—当前无冲突；纯粹是防御性建议。
- 建议: 无需修改；记录为 note。

## 3. Notes

1. TS project references 的引入路径（`shared → memory-store-adapter → core-memory → core-memory-semantics`）与实际 workspace 依赖链对齐，`references` 字段正确反映了编译时的依赖顺序。
2. `tsconfig.package-local-pilot.build.json` 使用 `files: []` + `references` 的标准 solution-style tsconfig 模式，让 `tsc -b` 从根目录增量编译整条依赖链，设计合理。
3. `.tsBuildInfoFile` 输出路径统一到 `dist/packages/<name>/tsconfig.build.tsbuildinfo`，与 dist-mirroring 模式一致，不会污染源码目录。
4. `run-gate-check.js` 从简单的 turbo-task 映射重构为 `kind: "turbo" | "script"` 双轨模型，扩展性良好。`affected` profile 通过 `kind: "script"` 委托给 `run-affected-check.js`，职责分离清晰。
5. `run-affected-check.js` 的三段路由逻辑（`fast_only` / `package_local_pilot` / `full_fallback`）符合 formal solution 中"粗粒度 diff routing"的定位，未过度追求理论最优。
6. 集成测试（`gate-runner-output.integration.test.ts`）已从验证 `affected` deferred 提示更新为验证真实执行路径：dry-run JSON 模式 + wrapper 回归。覆盖面合理。
7. CI matrix 的 `fail-fast: false` 设置确保 fast / affected 两个矩阵项可以并行运行而不互相取消，是正确的选择。
8. project-025 completion audit summary 内容完整，residual risks 与 follow-up advice 明确标记了 pilot 范围边界和"新开 stream"约束。
9. `current-context.md` 中添加 Note 说明 `project-025 / sprint-003` 真值已完成、仅暂保留为 active closeout surface，符合 Update Rules #4 中的例外条款。
10. `technical-solution-delivery-registry.yaml` 的 `execution_status` 已从 `in_progress` 切换到 `completed`，与 project plan 真值同步。
11. `master-execution-plan.md` 的 project 状态表和推荐执行顺序均已更新，反映 project-025 完成态。

## 4. Verification

1. `pnpm run check:package-local:pilot:incremental`（需运行验证）
2. `pnpm run check:affected -- --changed-file packages/shared/src/index.ts`（需运行验证）
3. `pnpm vitest run --config vitest.integration.config.ts test/gate-runner-output.integration.test.ts`（需运行验证）
4. `pnpm run check:fast`（需运行验证）
5. `node ./scripts/governance/check-task-ledger-sync.js`（需运行验证）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（需运行验证）

## 复核结论（2026-03-28）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**不认可**
   - 证据：`scripts/ci/run-affected-check.js` 当前 command plan 仍受 `fast_only / package_local_pilot / full_fallback` 三段路由约束，最大执行链路为 3 条命令；当前实现没有形成错误结果或不可接受的资源压力证据。
   - 处理：保留为后续扩围时的实现建议，不作为本轮阻断项。
2. `2.2`
   - 判定：**认可**
   - 证据：仓库中实际存在 `.codex/` 与 `docs/` 纯文档目录，而原 `DOC_ONLY_PREFIXES` 未覆盖这两类路径；只改 `.codex/skills/**/SKILL.md` 时会误路由到 `full_fallback`。
   - 处理：将 `.codex/` 与 `docs/` 纳入 doc-only 路由，并补充 integration test 覆盖 `.codex` 文档变更。
3. `2.3`
   - 判定：**不认可**
   - 证据：`/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-003-project-references-affected-check-and-ci-matrix/plan.md` 与 `TK-287` 已明确首版 `affected` planner 采用粗粒度 diff routing，当前 4 个 pilot 包的显式冻结属于设计边界，不是实现漂移。
   - 处理：保持现状；若未来扩围 pilot package，再以新 stream 收敛单一 source-of-truth。
4. `2.4`
   - 判定：**不认可**
   - 证据：sprint-003 输入约束与 gate execution contract 均要求 `full` 继续作为权威入口；将 `full` 保持独立 job 是当前 CI 语义的一部分，而不只是重复 setup 的偶然结果。
   - 处理：保持现状，不在本轮为了去重而削弱权威入口隔离。
5. `2.5`
   - 判定：**不认可**
   - 证据：该项本身已指出当前实现正确，仅为防御性 note；不存在需要即时修复的实际缺陷。
   - 处理：不修改。

### 验证命令
1. `pnpm exec biome check scripts/ci/run-affected-check.js test/gate-runner-output.integration.test.ts`（通过）
2. `pnpm vitest run --config vitest.integration.config.ts test/gate-runner-output.integration.test.ts`（通过）
3. `node ./scripts/ci/run-affected-check.js --dry-run --output json --changed-file .codex/skills/workspace-code-review-workflow/SKILL.md`（通过）

## 修复执行记录（2026-03-28）

1. `2.2`：已完成
   - 变更文件：`scripts/ci/run-affected-check.js`、`test/gate-runner-output.integration.test.ts`
   - 验证：`pnpm exec biome check scripts/ci/run-affected-check.js test/gate-runner-output.integration.test.ts`；`pnpm vitest run --config vitest.integration.config.ts test/gate-runner-output.integration.test.ts`；`node ./scripts/ci/run-affected-check.js --dry-run --output json --changed-file .codex/skills/workspace-code-review-workflow/SKILL.md`（通过）
   - 说明：扩充 doc-only 路由覆盖 `.codex/` 与 `docs/`，避免纯文档改动误退化到 `full_fallback`。

## Reviewer 二次确认（2026-03-28）

- 整体结论：**认可复核结论**

### 逐条确认

1. `2.1` 不认可 → **同意**
   - 当前最多 3 条命令、`full_fallback` 日志在数十 KB 量级，`spawnSync` + pipe 无实际内存压力。属于理论推演，缺乏实际问题证据。
2. `2.2` 认可 → **同意修复**
   - `.codex/` 和 `docs/` 确实是纯文档目录，扩充 `DOC_ONLY_PREFIXES` + 补齐 integration test 覆盖是正确的修复方向。验证命令全部通过。
3. `2.3` 不认可 → **同意**
   - TK-287 和 sprint-003 plan 明确"首版粗粒度 diff routing"、4 个 pilot 包是冻结的设计边界。三处同步是 by-design 的显式约束，不是遗漏。扩围应新开 stream。
4. `2.4` 不认可 → **同意**
   - `full` 作为独立 job 是 gate execution contract 的权威入口隔离要求，不应为了去重 setup 而降级为 matrix 中的普通项。
5. `2.5` 不认可 → **同意**
   - 原始 finding 已自认"当前正确、防御性建议"，不构成修复项。

### 模式反思

本轮 CR 与 sprint-002 CR 的复核模式一致：原始分析中"以理论推测代替实际复现"和"把设计边界误判为实现缺陷"的倾向被准确纠偏。后续 CR 应优先基于可复现证据给出 finding，对于设计边界类问题应先确认是否为 by-design 后再决定是否上报。
