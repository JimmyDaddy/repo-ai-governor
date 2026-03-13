# Standards Package Model

- Task: `TK-203`
- Date: 2026-03-13
- Status: done

## Goal

为标准规范包定义统一的数据模型，既能被 AI 命令执行链消费，也能以人类可读方式渲染，作为后续 `TK-204` 内容编写和 `plan / check / review` 消费的上游结构。

## Model Summary

标准规范包 v1 由以下结构组成：

1. `meta`
   - 包名、描述、预设来源
2. `locales`
   - 默认语言与支持语言
3. `categories`
   - 规范分类定义
4. `rules`
   - 规范条目

## Supported Categories

当前 v1 固定支持五类规范：

1. `code`
2. `engineering`
3. `process`
4. `quality`
5. `collaboration`

这五类直接对应 PRD 中定义的标准规范能力范围。

## Rule Model

每条规范至少包含：

1. `id`
2. `category`
3. `level`
4. `title`
5. `statement`
6. `consumers`
7. `views.ai`
8. `views.human`

可选字段：

1. `appliesTo`
2. `automation`
3. `views.ai.verification`
4. `views.human.rationale`
5. `views.human.remediation`

## Required vs Recommended

`level` 使用两档：

1. `required`
   - 表示强约束，后续可映射为阻断规则
2. `recommended`
   - 表示建议项，后续可映射为提醒或 warning

同时 `automation` 再补充机器执行语义：

1. `blockOnViolation`
2. `severity`
3. `stages`

这样可以把“业务语义”和“执行语义”分开，方便 `check` 与 `review` 直接消费。

## Dual View Model

同一条规则同时提供两类视图：

1. `views.ai`
   - 面向 AI/Agent
   - 关注指令表达与验证要点
2. `views.human`
   - 面向人类协作者
   - 关注摘要、原因、修复建议

当前字段设计：

1. `views.ai.instruction`
2. `views.ai.verification`
3. `views.human.summary`
4. `views.human.rationale`
5. `views.human.remediation`

所有文本字段都要求支持 `zh-CN` / `en-US`。

## Consumer Model

`consumers` 用于标识规则会被哪些命令或环节消费。当前 v1 支持：

1. `init`
2. `plan`
3. `check`
4. `review`
5. `review-verify`
6. `report`

这让后续命令实现不需要重新推断规则的适用面。

## Package Skeleton

当前内置 `official/base` 的模型骨架，不直接包含规范正文，但已经固化：

1. 预设 ID
2. 五类分类定义
3. 双语包级描述
4. 空规则集合

这保证 `TK-204` 可以在稳定结构上继续补官方规范内容。

## Code Artifacts

1. `src/config/schema/standards-package.schema.json`
2. `src/standards/package-model.js`
3. `test/config/schema.test.js`
4. `test/standards/package-model.test.js`

## Follow-ups

1. `TK-204` 基于该模型填充官方默认规范内容。
2. `TK-205`、`TK-206`、`TK-207`、`TK-208` 基于 `consumers + level + automation + views` 直接消费规则。
