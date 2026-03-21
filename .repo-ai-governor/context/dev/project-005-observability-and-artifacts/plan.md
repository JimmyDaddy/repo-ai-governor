# project-005-observability-and-artifacts 计划

- Status: planned
- Date: 2026-03-21
- Stage Mapping: Stage 6
- Phase Mapping: Phase D

## 1. 目标

1. 建立审计、报告、回放、依赖产物运行时。
2. 建立 CLI `pretty/plain/json` 输出契约。
3. 建立审计隐私治理（90 天保留、脱敏、导出/删除）。

## 2. 输入基线

1. `DA-049`：`.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-039-project-004-exit-acceptance-and-project-005-input-constraints.md`
2. `DA-050`：`.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-039-project-005-input-constraints-checklist.md`
3. 启动前默认消费 `artifact_id + artifact_path` 双键，不接受仅文件名引用。

## 3. 启动前约束

1. 先定义审计事件 schema 与回放字段契约，再推进 provider/runtime 实现。
2. CLI 输出必须同步定义 `pretty/plain/json` 三种模式兼容语义。
3. 所有 Stage 6 任务必须继承 `DA-050` 的 BLOCK/CONFIRM/AUTO_APPLY 风险分级输入。

## 4. 退出标准

1. `json` schema 稳定且 CI 可消费。
2. 审计日志可回放且满足隐私保留策略。
