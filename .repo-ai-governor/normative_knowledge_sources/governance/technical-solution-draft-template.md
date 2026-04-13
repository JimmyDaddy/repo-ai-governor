# Technical Solution Draft Template

- Status: active
- Date: 2026-04-12
- Scope: canonical technical-solution draft generation under `.repo-ai-governor/draft/**`
- Owner: `project-093-technical-solution-draft-template-and-skill / TK-811`

## 1. Purpose

1. 为后续 `.repo-ai-governor/draft/**` 下的新技术方案草案提供可直接复用的 concrete template。
2. 消除“有 review/promotion 流程，但没有统一 draft 生成模板”导致的结构漂移。
3. 让新草案天然具备 `draft -> review_pending -> approved -> active` 生命周期所需的 handoff 信息。

## 2. Usage Rules

1. 生成新的 technical solution draft 时，默认从本模板实例化，而不是自由发挥章节结构。
2. draft 只能落在 `.repo-ai-governor/draft/**`，不得被注册进 normative-loading manifest，也不得被当作正式规范源。
3. 顶部元数据至少填写 `Status/Date/Owner/Scope`；新 draft 默认补齐 `Target Modules` 与 `Related Inputs`。
4. `## 1. 背景与问题`、`## 2. 目标`、`## 3. 非目标`、`## 6. 推荐方案`、`## 8. 风险与权衡`、`## 10. Review / Promotion Handoff` 为默认保留章节；若当前窗口不适用，必须显式写明 `不适用`，避免章节漂移。
5. 草案必须显式区分“候选方案对比”和“最终推荐”，避免后续 review/promotion 需要反向推断作者结论。
6. 草案中若引用互联网资料，只能作为 supplemental evidence；仓库内结构化真值与规范文档仍优先。
7. 既有历史 draft 不要求批量回写，但新建或大改 draft 默认应向本模板收敛。

## 3. Concrete Template

```md
# <Technical Solution Title> (Draft)

- Status: draft
- Date: <YYYY-MM-DD>
- Owner: <AI-Agent|User|Owner>
- Scope: <一句话描述草案覆盖的能力边界、问题域或执行面>
- Target Modules:
  - `<module-id>`
  - `<module-id>`
- Related Inputs:
  - `<repo doc/code path or official reference link>`
  - `<repo doc/code path or official reference link>`

## 1. 背景与问题

<描述当前真实缺口、触发背景、已有实现现状，以及为什么值得单独形成技术方案草案。>

## 2. 目标

1. <目标 1>
2. <目标 2>
3. <目标 3>

## 3. 非目标

1. <非目标 1>
2. <非目标 2>
3. <非目标 3>

## 4. 现状与约束

1. <当前实现、已有 seam、约束、依赖或治理边界>
2. <必须保持不变的事实或兼容性约束>
3. <对方案选择有实际影响的风险/成本/时间窗口>

## 5. 方案选项与对比

### 5.1 方案 A

1. <方案描述>
2. 优点：<...>
3. 缺点：<...>

### 5.2 方案 B

1. <方案描述>
2. 优点：<...>
3. 缺点：<...>

### 5.3 对比结论

1. <为什么推荐其中一个方案，或为什么需要 phased adoption>

## 6. 推荐方案

1. <推荐架构/机制/流程的核心结论>
2. <关键职责分层、组件关系、contract 影响>
3. <与现有 active solution、formal docs 或 runtime seam 的关系>

## 7. 核心设计与契约影响

1. <必要时分成数据结构、命令契约、CLI/UX、runtime seam、policy/audit 等子节>
2. <如果某类契约不适用，显式写“不适用”即可>

## 8. 风险与权衡

1. <主要风险>
2. <trade-off>
3. <缓解思路或回滚点>

## 9. 分阶段落地建议

1. <Phase A>
2. <Phase B>
3. <Phase C / follow-up>

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.<slug>`
2. 建议 `target_module_ids`：`<module-id>` / `[]`
3. 进入 `technical-solution-review` 前需要重点复核的边界：<...>
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：<...>
```

## 4. Notes

1. 本模板强调“背景/目标/非目标/选项对比/推荐方案/风险/落地建议/handoff”这条最小闭环；草案可按主题加子节，但不应删除闭环骨架。
2. 若技术方案显著影响 triad docs、layering boundary、runtime contract 或 module graph，应在草案中显式点名受影响面，方便后续 review 时触发 manifest 补载。
3. 当已有草案结构明显不一致但内容仍可复用时，优先重排到本模板，而不是另起一份平行 draft。
