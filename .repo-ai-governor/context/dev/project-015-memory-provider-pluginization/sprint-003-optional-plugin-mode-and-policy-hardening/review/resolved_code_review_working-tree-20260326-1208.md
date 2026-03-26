# Code Review: sprint-003 optional plugin mode working tree

- Status: resolved
- Date: 2026-03-26
- Reviewer: AI-Agent
- Task: `TK-172|TK-173|TK-174`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `package.json`
2. `scripts/release/check-release-ready.js`
3. `scripts/release/render-release-notes.js`
4. `scripts/release/verify-cleanroom-local-install.js`
5. `scripts/release/verify-local-distribution.js`
6. `apps/cli/src/main.ts`
7. `packages/memory-provider-registry/src/memory-provider-registry.ts`

## 2. Findings
### 2.1 [P1] plugin-enabled 发行面未进入正式 release candidate 门禁
- 位置: `package.json`
- 问题描述: 本轮已新增 `release:verify-local:plugin-enabled` 与 plugin-enabled clean-room 校验能力，但 `release:candidate` 仍只执行默认发行包的 local/clean-room 验证。这样一来，`plugin-enabled distribution` 的真实回归不会阻塞 `ga-check`，发布门禁与 `DA-173` 的交付口径不一致。
- 影响: plugin-enabled 发行面可能在未经过正式 release candidate 覆盖的情况下回归，导致发布产物对 optional plugin mode 的承诺失真。
- 建议: 把 plugin-enabled local verify、clean-room verify，以及 tgz clean-room verify 全部纳入 `release:candidate`，并同步更新 release-ready 与 release notes 的必需脚本/命令清单。

## 3. Notes
1. 其余 inspected 变更未发现需要单独保留的阻塞问题。
2. 当前 active stream 仍保持在 `project-015 / sprint-003`；本次 review 未改动 `current-context` 的主执行流归属。

## 4. Verification
1. `node ./scripts/release/check-release-ready.js`（通过）
2. `pnpm run release:verify-cleanroom-local-install:plugin-enabled:tgz`（通过）
3. `pnpm run check`（通过）

## 复核结论（2026-03-26）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`release:candidate` 原先未串联任何 plugin-enabled verify 命令，而 `TK-173` 已对外宣称建立了 plugin-enabled distribution 与 clean-room/release gate 基线。
   - 处理：已将 plugin-enabled local verify、clean-room verify 与 tgz clean-room verify 纳入正式 release candidate，并同步更新 release-ready / release notes。

### 验证命令
1. `node ./scripts/release/check-release-ready.js`（通过）
2. `pnpm run release:verify-cleanroom-local-install:plugin-enabled:tgz`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-03-26）

1. `2.1`：已完成
   - 变更文件：`package.json`、`scripts/release/check-release-ready.js`、`scripts/release/render-release-notes.js`
   - 验证：`node ./scripts/release/check-release-ready.js`、`pnpm run release:verify-cleanroom-local-install:plugin-enabled:tgz`、`pnpm run check`（通过）
   - 说明：release candidate 现在会显式覆盖 plugin-enabled local/tgz clean-room 验证，发布门禁与 sprint-003 的交付口径已对齐。
