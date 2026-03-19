# project-003-standards-and-slots 计划

- Status: planned
- Date: 2026-03-19
- Stage Mapping: Stage 4
- Phase Mapping: Phase B/C

## 1. 目标

1. 完成 Standards 渲染投影闭环与 Spec Sync Guard。
2. 完成 Slot 双轨（声明式 + 脚本）并满足安全模型。
3. 完成升级 UX 闭环（冲突清单、回滚、版本 pin）。

## 2. 核心交付

1. `rule-renderer`、`agents-projector`、多语言渲染一致性。
2. Slot 脚本安全六项：沙箱、权限审批、资源限制、I/O 契约、失败隔离、审计字段。
3. Spec Sync Guard 门禁接线。

## 3. 退出标准

1. human/ai/agents 三视图同源且可追溯。
2. 升级冲突可识别、可回滚、可复盘。
3. Slot 脚本能力默认最小权限且审计完整。
