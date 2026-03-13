# Declarative Slot Schema

- Task: `TK-301`
- Date: 2026-03-13
- Status: done

## Goal

为项目本地插槽、团队共享插槽和官方插槽定义统一的声明式 schema，使插槽可以被结构化校验、排序、触发和注入，而不需要先引入脚本型扩展。

## Model Summary

插槽模型 v1 由五层组成：

1. `meta`
2. `trigger`
3. `scope`
4. `behavior`
5. `checks`

## Meta Model

`meta` 负责描述插槽自身身份，当前包含：

1. `name`
2. `source`
3. `slotType`
4. `owner`
5. `description`
6. `tags`

### Source

`source` 用于区分插槽来源：

1. `project-local`
2. `team-shared`
3. `official`

这让后续 `TK-302` 可以基于来源做优先级与冲突解释。

### Slot Type

`slotType` 当前支持：

1. `architecture-constraint`
2. `security-compliance`
3. `domain-knowledge`
4. `test-strategy`
5. `release-approval`
6. `documentation-output`
7. `custom`

## Trigger Model

`trigger` 当前采用声明式命中条件：

1. `match`
   - `any`
   - `all`
2. `when.paths`
3. `when.stages`
4. `when.events`
5. `when.adapters`
6. `when.commands`

这样既能表达“在 `review` 阶段触发”，也能表达“只在 `codex` + `plan` 命令下命中”。

## Scope Model

`scope` 用于限制插槽适用面：

1. `languages`
2. `frameworks`
3. `projects`
4. `files`
5. `tags`

这让相同插槽模型可以被不同仓库或子项目有条件地复用。

## Behavior Model

`behavior` 用于表达执行语义和冲突处理：

1. `blockOnFailure`
2. `priority`
3. `requiresApproval`
4. `conflictPolicy`
5. `dependsOn`
6. `supersedes`
7. `inject`

### Conflict Policy

当前支持：

1. `error`
2. `override`
3. `merge`

### Injection

`inject` 维持双视图入口：

1. `inject.ai.promptKey`
2. `inject.human.docSection`

## Checks Model

`checks.before` 与 `checks.after` 暂时保持轻量的字符串列表，后续可以在不破坏整体结构的前提下升级为更细的声明对象。

## Code Artifacts

1. `src/config/schema/slot.schema.json`
2. `src/slots/slot-model.js`
3. `test/config/schema.test.js`
4. `test/slots/slot-model.test.js`

## Follow-ups

1. `TK-302` 复用 `source + priority + conflictPolicy + dependsOn + supersedes` 实现插槽加载与冲突处理。
2. `TK-303` 基于当前 schema 提供官方示例插槽。
3. `TK-401` 适配器接口可直接消费 `trigger.adapters` 和 `inject` 字段。
