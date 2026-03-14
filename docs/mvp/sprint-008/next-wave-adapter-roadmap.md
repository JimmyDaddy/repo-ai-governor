# Next-Wave Adapter Roadmap

- Date: 2026-03-14
- Task: `TK-405`

## Goal

基于当前已经完成的 `Codex / GitHub Copilot / Claude Code` 首批适配样例，给出第二批工具接入的优先级标准、候选清单和工作量预估，作为下一轮 sprint 的输入。

## Current Baseline

1. 已有统一适配器模型。
2. 已有三类首批样例 bundle：
   - Codex / Codex CLI
   - GitHub Copilot / GitHub Copilot CLI
   - Claude Code
3. 已有可复用资产：
   - `AGENTS.md` 与 `current-context`
   - workflow / standards / slots / artifacts bundle
   - CLI 验收与报告能力

## Priority Rubric

第二批工具优先级按以下 5 个维度排序：

1. 是否有稳定的规则注入入口
2. 是否支持仓库内文件作为长期上下文
3. 是否支持非交互式或可脚本化执行
4. 是否与现有 bundle 能力复用度高
5. 是否能带来明显的新覆盖面，而不是仅与现有样例高度重复

## Candidate List

| Tool / Mode | Priority | Effort | Why Now | Reuse Level |
| --- | --- | --- | --- | --- |
| Cursor | High | Medium | 与现有 agent-entry / prompt bundle 兼容度高，用户覆盖面大 | High |
| API-driven mode | High | Medium | 能覆盖自建平台、CI 编排和多模型中台场景 | High |
| VS Code generic workflow | Medium | Medium | 覆盖通用 IDE 工作流，但注入入口需要做更抽象的文件策略 | Medium |
| Cline | Medium | Medium | 具备 Agent 工作流价值，但权限和提示注入模型与现有样例不完全一致 | Medium |
| Roo Code | Medium | Medium | 与 Cline 相近，适合放在同一波评估，但可晚于 Cline | Medium |

## Recommended Sequence

1. 第一优先级
   - Cursor
   - API-driven mode
2. 第二优先级
   - VS Code generic workflow
   - Cline
3. 第三优先级
   - Roo Code

## Suggested Scope Per Candidate

### Cursor

1. 目标：适配指令文件、项目上下文和任务 prompt 注入。
2. 复用点：可直接复用现有 bundle 与 `AGENTS.md` / `current-context`。
3. 风险：需要确认其规则入口与长期上下文加载方式的稳定性。

### API-driven mode

1. 目标：把当前 bundle 输出变成可供任意模型 API 消费的标准输入。
2. 复用点：统一报告、workflow、standards、slots 都可直接复用。
3. 风险：需要明确调用方责任边界，避免把 orchestration 和 adapter 混在一起。

### VS Code Generic Workflow

1. 目标：提供一个不依赖单一插件的通用 IDE 接入约定。
2. 复用点：可复用 `AGENTS.md`、project docs、task artifacts。
3. 风险：规则注入不如专用 agent 工具稳定，需要更保守的承诺方式。

### Cline / Roo Code

1. 目标：覆盖更偏 Agent 化的 VS Code 生态。
2. 复用点：可复用 Claude Code / Codex 的 task prompt bundle 思路。
3. 风险：工具能力变化较快，维护成本高于第一批样例。

## Sprint Planning Recommendation

1. 下一轮如果偏“功能扩展”，先做 Cursor + API-driven mode。
2. 下一轮如果偏“生态验证”，先做 Cursor + VS Code generic workflow。
3. `Cline / Roo Code` 更适合在上面两类路径跑顺后进入同一轮评估。

## Verification

1. 已核对当前已落地适配资产：
   - `examples/adapters/codex/`
   - `examples/adapters/github-copilot/`
   - `examples/adapters/claude-code/`
2. 已确认路线图覆盖 `Cursor`、`VS Code` 通用工作流、`Cline`、`Roo Code`、API 驱动模式。
