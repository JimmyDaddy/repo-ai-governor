# Code Review: TK-023 Memory Store Engine 配置与 CLI 组装接入

- Status: verified
- Date: 2026-03-20
- Reviewer: AI-Agent
- Task: `TK-023`
- Review Type: staged code review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` §4.1, §4.2.1
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` §2, §7
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/shared/src/constants|types`：memory runtime contract 与默认值。
2. `packages/config/src/*`：memory 字段 schema 校验、profile merge、upgrade clone。
3. `apps/cli/src/main.ts`：provider 选择与组装。
4. `test/memory-store-config-and-cli-composition.smoke.test.ts`：配置与 CLI 回归覆盖。

## 2. Findings

本轮未发现阻断交付问题。

## 3. Positive Checks

1. memory store engine 受枚举约束，配置输入不再散落字符串字面量。
2. CLI 组装层可按 `memory.storeEngine` 在 `fs_csv/sqlite_fs` 间切换并回显组装结果。
3. 默认配置兼容旧仓库（未显式声明 `memory` 时自动使用 shared baseline）。
4. 新增 smoke 覆盖 config->profile->cli composition 主链路，降低回归风险。

## 4. Residual Risks

1. `node:sqlite` 仍为实验特性，跨 Node 版本兼容策略需后续强化。
2. 当前配置仅覆盖 engine 与 root，provider 细粒度参数可在后续迭代扩展。

## 5. 复核结论（2026-03-20）

- 整体结论：**认可**。
- 阻断项：0。

### 5.1 复核命令与结果

1. `pnpm run typecheck`：通过。
2. `pnpm run test -- memory-store-config-and-cli-composition.smoke.test.ts`：通过。
3. `pnpm run test -- cli-skeleton.smoke.test.ts`：通过。
4. `pnpm run check`：通过。
