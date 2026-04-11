# Normative Loading Manifest 生命周期出清与渐进分片技术方案（Draft）

- Status: draft
- Date: 2026-04-10
- Owner: AI-Agent
- Scope: `normative loading manifest / lifecycle compaction / archive split / deferred active sharding`
- Related Task: n/a

## 1. 目的

为 `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml` 提供一套可渐进落地的治理方案，解决以下问题：

1. 主 manifest 持续增长后，人类审阅成本与 AI 启动解析成本都会上升。
2. 历史/归档条目即使不参与默认加载，也会继续占据主清单体积。
3. 规范文档继续增加时，如果没有生命周期退出机制，主清单会持续膨胀。
4. 仓库需要一个清晰结论：manifest 当前是否应该直接切到 sqlite canonical truth，还是先做更低风险的治理收缩。

本文的目标不是一次性重写 manifest 体系，而是先把“当前可批准、可在一个治理窗口内安全落地”的部分收敛清楚。

## 2. 当前观察

以 `2026-04-10` 的仓库状态为样本，manifest 已表现出增长压力：

1. 主文件约 `1075` 行。
2. `documents=78`，`external_required_inputs=3`。
3. `status=active` 的条目有 `78` 个，`status=archived` 的条目有 `3` 个。
4. tier 分布为：
   - `L0=5`
   - `L1=7`
   - `L2=66`
   - `L3=3`
5. 当前膨胀主因不是 archived 条目数量，而是 active `L2` 文档的持续增加。

同时，现有治理面已经明确两件事实：

1. `AGENTS.md` 与 `code_standards.md` 仍把单文件 `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml` 视为启动期和规则层的唯一事实来源。
2. 现有 gate 会跳过 `/archive/`、`/superseded/` 路径，也不会把 `archived/deprecated` 文档当成默认执行面。

这说明仓库已经承认“历史项应该退出主执行面”，但还没有把 manifest 自身的生命周期治理正式化。

## 3. 与现有 active solution 的关系

本方案不替代现有 `technical-solution.modular-loading-and-dependency-governance`。

两者边界如下：

1. `technical-solution.modular-loading-and-dependency-governance`
   - 解决的是“模块级技术方案如何按需加载、如何做 contract-first 依赖展开、如何控制技术方案上下文膨胀”。
2. 当前方案
   - 解决的是“仓库级 normative loading manifest 自身如何做生命周期出清，避免 bootstrap catalog 无限增长”。

换句话说：

1. 前者治理 `technical-solutions/**` 的模块图与加载策略。
2. 后者治理 root manifest 作为仓库级 bootstrap catalog 的生命周期收缩。

因此，本方案是补充而不是 supersede。

## 4. 目标与非目标

### 4.1 目标

1. 让 root manifest 继续保持启动期可读、可审、可直接解析。
2. 给 manifest 引入明确的生命周期退出机制，避免主文件无限增长。
3. 在不改变现有单文件 bootstrap truth 的前提下，先完成低风险的 archive split 与 deprecated compact。
4. 为未来 active sharding 保留设计空间，但不把它混入当前 approval scope。
5. 在没有足够收益前，不把启动入口升级为更重的 sqlite truth。

### 4.2 非目标

1. 不把 draft 直接纳入 manifest。
2. 不把 manifest 改成高频自动写入、复杂联表查询的账本系统。
3. 不在当前批准范围内引入 `root + shard manifests` 的 canonical truth cutover。
4. 不在本方案中同时重写 triad、module registry、lifecycle registry 的既有职责边界。

### 4.3 当前批准范围

当前 draft 只申请批准以下范围：

1. `archive split`
   - 把 archived entries 从 root manifest 迁出到独立 archive manifest。
2. `deprecated compact`
   - 为 `deprecated -> archived` 建立治理规则、宽限窗口与运维命令。
3. `root manifest single-truth preservation`
   - 在上述变更完成后，root manifest 仍保持当前唯一 bootstrap truth 角色，不引入新的 active catalog truth surface。

以下内容明确不属于当前批准范围：

1. active `L2/L3` shard manifests
2. `manifest_refs`
3. merged active catalog
4. `root + shard manifests` canonical cutover
5. sqlite projection

这些内容若未来需要推进，必须另起 follow-up technical solution，不与当前批准窗口混合。

## 5. 决策结论

推荐采用以下结论：

1. `现在不把 normative-loading-manifest 改成 sqlite 真值。`
2. `当前批准范围只覆盖 archive split + deprecated compact。`
3. `当前批准范围内，root manifest 继续保持唯一 bootstrap truth。`
4. `未来若仍要做 active sharding，必须作为独立 follow-up 重新评审。`

## 6. 为什么当前不推荐 sqlite 真值

与 task ledger、artifact registry 不同，manifest 当前不具备强烈的 sqlite 驱动力：

1. 没有高频状态写入。
2. 没有复杂联表查询需求。
3. 没有 append-only 历史账本语义。
4. 启动期消费者更需要“直接读一个小文件”，而不是“先打开数据库再求值”。

若直接切到 sqlite canonical truth，会引入新的复杂度：

1. bootstrap 依赖变重。
2. git diff 失去可读性，审查 manifest 变更会退化。
3. 手工修正门槛上升。
4. 需要新的 render/export 步骤，才能保留 YAML 兼容入口。
5. 需要额外回答“启动时读 sqlite 还是读渲染 YAML，哪个才是真值”的治理问题。

因此更合理的顺序是：

1. 先让 root manifest 变小。
2. 再观察是否还需要更重的存储形式。

## 7. 模块归属边界

本方案当前不把 manifest 生命周期治理错误地挂到现有 active technical-solution modules 上。

明确边界如下：

1. `governance.technical-solution-registry`
   - 继续负责 lifecycle/module/delivery registry 的结构化事实源。
   - 不替代 root manifest 的仓库级文档登记职责。
2. `governance.spec-sync`
   - 继续负责 triad + brief + module docs impact classification。
   - 不替代 root manifest 的 active 文档登记职责。
3. `governance.execution-gates`
   - 继续负责 gate execution profile 与执行分层。
   - 可消费 manifest gate 的运维变化，但不是 root manifest 事实面的 owner。

因此，当前 draft 在 review/approved 阶段故意不把 `target_module_ids` 绑定到现有 active modules。

后续 promotion 若真的要 formalize，本方案只有两种允许路径：

1. 新建专门模块，例如 `governance.normative-loading`，再把 formal docs 与 contract 明确挂到新模块。
2. 明确声明这是“governance docs-only protocol”，不把它伪装成某个现有 active module 的扩展。

在 promotion 路径被选定前，`target_module_ids` 保持为空是有意设计，不是遗漏。

## 8. 生命周期模型

建议把 manifest entry 的治理语义明确为以下状态：

1. `active`
   - 当前有效，可参与加载决策。
2. `frozen`
   - 仍可被读取与追溯，但不鼓励继续扩展；仍保留在 root active catalog。
3. `deprecated`
   - 仍可被历史触发或兼容性链路引用，但不应停留太久；必须在宽限期内迁出 root active catalog。
4. `archived`
   - 只保留追溯用途；退出 root active catalog。

推荐规则：

1. `default_load=true` 只允许 `active/frozen`，继续沿用现有约束。
2. `deprecated/archived` 不允许 default load。
3. root manifest 中不应长期保留 `archived` 条目。
4. `deprecated` 允许短期存在，但需要显式宽限期与迁出动作。

## 9. 当前批准范围内的信息架构

当前批准范围只引入一个新增侧面：

```text
.repo-ai-governor/normative_knowledge_sources/
  normative-loading-manifest.yaml
  governance/
    normative-loading-manifest-lifecycle-governance.md
  archive/
    normative-loading-manifest.archive.yaml
```

职责约束如下：

1. root manifest
   - 继续是唯一 startup truth。
   - 继续被 `AGENTS.md`、`long-term-maintenance-guide.md` 与现有 gate 直接消费。
   - 当前批准范围内不改成 `manifest_refs` 模式。
2. archive manifest
   - 只保存 `archived` entries。
   - 只承担历史追溯，不进入默认启动加载面。
   - 不是新的 startup truth。
3. lifecycle governance doc
   - 只定义出清规则、阈值、运维命令与同窗口变更要求。

## 10. 当前批准范围内的 canonical truth contract

这是本方案最关键的约束。

在当前批准范围内：

1. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
   - 继续是唯一 bootstrap truth。
2. archive manifest
   - 不是 bootstrap truth。
   - 只是 archived catalog sidecar。
3. 当前 schema 保持与现有 root manifest parser 兼容。
   - 不新增 `manifest_refs`
   - 不要求 gate 合并多个 active manifests
4. 任一 `deprecated -> archived` 迁移，必须在同一 change window 同步更新：
   - root manifest
   - archive manifest
   - lifecycle governance doc（若规则发生变化）
5. rollback 语义保持简单：
   - 若迁移后需要回滚，只需把对应 entry 从 archive manifest 回写 root manifest，并保持 schema 不变。

这意味着当前批准窗口没有“单文件真值 -> 多文件 active 真值”的原子 cutover 风险。

## 11. Gate 与运维建议

### 11.1 Gate 约束

在当前批准范围内，建议新增或补充以下规则：

1. root manifest 中不得长期保留 `archived` entries。
2. `deprecated` entries 超过宽限天数必须迁出。
3. archive manifest 只能包含 `archived` entries。
4. root manifest 与 archive manifest 中不得出现重复 path / doc_id。
5. root manifest 仍必须满足现有单文件 parser 与 gate 的兼容约束。

### 11.2 运维脚本

建议新增：

1. `scripts/governance/compact-normative-loading-manifest.js`
   - 负责把 root manifest 中超期 `deprecated` 条目迁入 archive manifest。
2. `scripts/governance/check-normative-loading-manifest-archive.js`
   - 校验 archive manifest 只承载 archived catalog，且不会与 root manifest 重叠。
3. `pnpm run manifest:compact -- --dry-run`
4. `pnpm run manifest:archive-check`

### 11.3 推荐阈值

建议先采用保守阈值：

1. `deprecated_days=14`
2. root manifest 中 `archived` 条目目标值为 `0`
3. 若 root manifest 在 archive split + deprecated compact 完成后仍持续增长，再单独触发 active sharding follow-up 评估

## 12. 渐进迁移路径

### Phase A：archive split

1. 引入 manifest lifecycle governance 文档。
2. 把 archived entries 从 root manifest 迁到 archive manifest。
3. 保持 root manifest schema 与现有 parser 完全兼容。

### Phase B：deprecated compact

1. 引入 `deprecated` 宽限窗口。
2. 增加 compact 脚本与 dry-run。
3. 在 monthly audit 中加入 manifest compact 检查。

### Deferred Follow-Up：active sharding

如 Phase A/B 完成后，root manifest 仍然持续增长，再单独起一份 follow-up technical solution 讨论：

1. 是否要引入 active shard manifests
2. 是否要引入 `manifest_refs`
3. 是否要修改现有 parser/gate
4. 是否需要 merged compatibility view
5. 是否值得进一步评估 sqlite projection

这一 follow-up 不应与当前批准窗口绑定。

## 13. 风险与权衡

### 13.1 风险

1. archive split 会引入第二个历史侧面文件，需要额外运维命令保障不漂移。
2. deprecated 宽限阈值若设置过短，可能误伤仍有追溯价值的文档。
3. 如果未来仍要推进 active sharding，仍需再次处理 canonical truth cutover 问题。

### 13.2 权衡

推荐接受的权衡是：

1. 先接受少量额外的 compact/archive-check 复杂度。
2. 换取 root manifest 持续保持小而稳定。
3. 避免把一个“上下文膨胀问题”过早升级成“启动期 truth cutover 问题”。

## 14. Promotion Handoff

如果本 draft 进入 `approved`，promotion 前仍需先决定 formal landing：

1. 若选择新模块 `governance.normative-loading`
   - promotion 需先在 module registry 中创建真实模块，再写 formal docs。
2. 若选择 docs-only governance protocol
   - promotion 需明确不会把它伪装成现有 active module 的扩展。

无论哪条路径，都必须保持以下事实不变：

1. 当前批准范围内，root manifest 仍是唯一 startup truth。
2. active sharding 不在本次 promotion scope。

## 15. 最终建议

本方案推荐的正式结论是：

1. `normative-loading-manifest` 应建立出清机制。
2. 第一优先级不是 sqlite，也不是 active sharding，而是 `archive split + deprecated compact`。
3. 当前批准范围内不改变 root manifest 的单文件 truth 角色。
4. 未来若仍需 active sharding，必须单独起 follow-up technical solution 再评审。
