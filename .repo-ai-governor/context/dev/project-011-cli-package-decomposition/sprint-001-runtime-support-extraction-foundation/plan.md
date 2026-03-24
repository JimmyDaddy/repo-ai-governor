# sprint-001-runtime-support-extraction-foundation 计划

- Status: in_progress
- Date: 2026-03-24
- Project: `project-011-cli-package-decomposition`

## 1. Sprint Goal

建立 project-011 的 decomposition baseline，并完成 CLI runtime 支撑层第一批抽离，为 `project-010` sprint-002 冻结输入边界。

## 2. In-Scope Tasks

1. TK-115 project-011 启动与 CLI package decomposition 依赖重排（completed）
2. TK-116 adapter verification 与 local probe 模块抽离（completed）
3. TK-117 route fallback 与 diagnostics artifact builder 抽离（planned）
4. TK-118 sprint-001 出口验收与 sprint-002 输入约束（planned）

## 3. Entry Criteria

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md` 已存在并可作为唯一分析输入。
2. `CS-027` anti-God-object 规则已生效。
3. `project-010` 仍保持 active，但 CLI package 大型结构重构改由 project-011 承接。

## 4. Exit Criteria

1. `DA-113`~`DA-116` 可检索并通过台账/artifact registry 门禁。
2. `adapter verification/local probe` 与 `route/fallback/diagnostics` 的目标归属边界被文档和代码同时确认。
3. `project-010` sprint-002 已显式回链本 sprint 的输出，不再默认将新主链逻辑挤入 `cli-governance-runtime.ts`。
