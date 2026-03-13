# Unified Adapter Interface

- Task: `TK-401`
- Date: 2026-03-13
- Status: done

## Goal

定义统一适配器接口，让不同模型、IDE、CLI 和 agent 工具都通过同一套治理输入输出契约接入，而不需要修改核心流程、规范和插槽模型。

## Model Summary

适配器接口 v1 由六层组成：

1. `meta`
2. `targets`
3. `capabilities`
4. `contract`
5. `injection`
6. `policy`

## Meta Model

`meta` 用于声明适配器身份：

1. `name`
2. `provider`
3. `description`

## Targets Model

`targets` 用于描述适配器实际面向的工具和入口：

1. `products`
2. `entrypoints`
3. `protocols`

### Entry Points

当前固定支持：

1. `ide`
2. `cli`
3. `agent`
4. `ci`

### Protocols

当前固定支持：

1. `file`
2. `template`
3. `prompt`
4. `command`
5. `agent-entry`

## Capabilities Model

`capabilities` 用于表达不同工具的能力边界：

1. `promptInjection`
2. `structuredOutput`
3. `toolCalling`
4. `fileSystemAccess`
5. `terminalAccess`
6. `patchEditing`
7. `approvalControl`

## Contract Model

`contract` 用于定义适配器和治理核心之间的输入输出接口。

### Input Contract

`contract.input` 当前支持：

1. `sources`
2. `requiredViews`
3. `supportedFormats`

标准输入源：

1. `workflow`
2. `standards`
3. `slots`
4. `agent-entry`
5. `artifacts`
6. `runtime-context`

### Output Contract

`contract.output` 当前支持：

1. `artifactKinds`
2. `supportedFormats`
3. `supportsReviewLifecycle`

标准输出工件：

1. `plan`
2. `check-report`
3. `review-report`
4. `task-record`
5. `summary`
6. `agent-entry`

## Injection Model

`injection` 用于统一规则注入入口：

1. `mode`
2. `sources`
3. `promptSections`
4. `templateVariables`

## Policy Model

`policy` 用于声明适配器对执行约束的要求：

1. `strictWorkflow`
2. `nonInteractiveSafe`
3. `allowAutonomousExecution`
4. `requiresApprovalFor`

## Mainstream Presets

当前内置三个首批目标预设：

1. `codex`
2. `github-copilot`
3. `claude-code`

## Code Artifacts

1. `src/config/schema/adapter.schema.json`
2. `src/adapters/adapter-model.js`
3. `test/config/schema.test.js`
4. `test/adapters/adapter-model.test.js`

## Follow-ups

1. `TK-402`、`TK-403`、`TK-404` 基于当前预设分别补 `Codex`、`GitHub Copilot`、`Claude Code` 接入样例。
2. 后续命令实现可只依赖 `contract.input` 与 `contract.output`，无需关心具体供应商细节。
