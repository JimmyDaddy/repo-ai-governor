# Slot Runtime Integration

- Date: 2026-03-14
- Task: `TK-302`

## Goal

把声明式插槽从静态 schema 和样例 YAML 推进到可被执行链路真实消费的 runtime 层。

## What Landed

1. 新增 `src/slots/runtime.js`
   - 负责已启用插槽发现
   - 负责 trigger / scope 命中
   - 负责 `priority + source` 排序
   - 负责 `supersedes`、`conflictPolicy`、`dependsOn` 决策
   - 输出注入摘要、前后检查摘要和冲突解释
2. Governance Engine 现在可在 stage 运行前解析当前 stage 的 slot resolution，并把结果注入 stage context。
3. `check` 命令已接入 slot runtime，JSON workflow stage 结果里会带上 active slot、suppressed slot 和 injection 摘要。

## Resolution Rules

1. 只处理 `config.slots.enabled` 中显式启用且未被 `disabled` 禁用的插槽。
2. 排序优先级采用 `priority` 降序，其次采用来源优先级：
   - `project-local`
   - `team-shared`
   - `official`
3. `supersedes` 先执行，显式覆盖被 supersede 的插槽。
4. 冲突检测当前覆盖：
   - 相同 `slotType`
   - 相同 `inject.ai.promptKey`
   - 相同 `inject.human.docSection`
5. 冲突处理顺序：
   - 若存在 `override`，保留胜出插槽并压制其余插槽
   - 若全部为 `merge`，保留全部插槽
   - 否则抛出 explainable `SlotConflictError`
6. `dependsOn` 在冲突处理后执行，缺依赖的插槽进入 blocked 集合。

## Runtime Shape

slot resolution 当前包含：

1. `matchedSlots`
2. `activeSlots`
3. `blockedSlots`
4. `suppressedSlots`
5. `skippedSlots`
6. `conflicts`
7. `injections`
8. `checks`

## Verification

1. 新增 `test/slots/runtime.test.js`
2. 新增 Governance Engine slot 接入测试
3. 新增 `check` 命令 slot 集成测试
4. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check` 通过
