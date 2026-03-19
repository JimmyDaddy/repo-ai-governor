# Normative Knowledge Sources 接入基线（TK-211）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-002`
- Task: `TK-211`

## 1. 目标

定义 `normative_knowledge_sources` 的接入契约与目录基线，确保“标准类记忆（永久记忆）”在 `tool_managed/repo_local` 两种 workspace 模式下都可被统一发现、装载、审计和回放。

## 2. 范围与非目标

1. 范围：
   - 固化规范知识源目录结构、索引契约与装载顺序。
   - 固化规范资产元数据字段与审计要求。
   - 固化与 `core-memory`、`memory-store-adapter` 的接入边界。
2. 非目标：
   - 本任务不实现具体 provider 存储驱动细节。
   - 本任务不定义执行态记忆（operational state）结构（由 `TK-212` 负责）。
   - 本任务不实现 session 事件总线与快照回放（由 `TK-213/TK-214` 负责）。

## 3. 目录与索引基线

建议目录：

```text
<workspace_root>/normative_knowledge_sources/
  index.csv
  product/
  architecture/
  standards/
  governance/
```

约束：
1. `index.csv` 为规范资产统一入口，至少包含 `asset_id/path/type/version/status/updated_at`。
2. 两种 workspace 模式目录语义必须一致，仅根路径不同。
3. 规范资产允许“副本纳管”或“索引纳管”，但都必须可追溯到真实来源。

## 4. 规范资产契约（Draft）

```ts
enum NormativeAssetType {
  ProductRequirement = "product-requirement",
  ArchitectureConstraint = "architecture-constraint",
  CodeStandard = "code-standard",
  GovernancePolicy = "governance-policy",
}

enum NormativeAssetStatus {
  Active = "active",
  Draft = "draft",
  Deprecated = "deprecated",
}

interface NormativeKnowledgeAsset {
  assetId: string;
  path: string;
  type: NormativeAssetType;
  version: string;
  status: NormativeAssetStatus;
  changedBy: string;
  changedAt: string; // RFC3339 秒级
  changeReason: string;
  diffRef?: string;
}
```

CS-009 落地要求：
1. `NormativeAssetType` 与 `NormativeAssetStatus` 在实现中必须集中放在 `src/constants/`。
2. 禁止在装载器中散落同语义字面量集合。

## 5. 装载与消费流程

1. `discover`：扫描 `normative_knowledge_sources` 目录与索引。
2. `validate`：校验路径可读、索引完整、状态合法。
3. `register`：将资产注册到 memory 读模型（scope=normative）。
4. `snapshot`：生成规范资产快照供 session/replay 引用。

优先级建议：
1. 仓库内显式配置优先。
2. workspace 索引次之。
3. 缺失时返回可恢复告警，不静默跳过关键规范项。

## 6. 审计与一致性要求

1. 规范资产变更必须记录：`changed_by/changed_at/change_reason/diff_ref`。
2. `changed_at` 使用 RFC3339 秒级时间戳，并提供可读展示字段（如 `YYYY-MM-DD HH:mm:ss UTC±HH:MM`）。
3. 资产状态从 `active` -> `deprecated` 时，不可直接删除，需保留回链。

## 7. 与存储适配层边界

1. 上层通过 `memory-store-adapter` 契约读写，不直接依赖文件系统细节。
2. 基线后端使用文件/CSV；后续可平滑迁移到 SQLite/Postgres，不改变语义。

## 8. 后续任务输入映射

1. `TK-212`：复用规范资产索引与装载口径，建立执行态记忆对齐策略。
2. `TK-215`：复用规范资产审计字段，补齐 workspace/session/memory 审计模型。
3. `TK-216`：将本基线纳入 M2 退出测试输入。
4. `TK-217`：复用索引契约与状态字段，衔接 Artifact Registry 解析契约。

## 9. 验收标准

1. `normative_knowledge_sources` 目录与索引契约已固定。
2. 规范资产元数据与审计字段满足总方案 `4.3` 要求。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
