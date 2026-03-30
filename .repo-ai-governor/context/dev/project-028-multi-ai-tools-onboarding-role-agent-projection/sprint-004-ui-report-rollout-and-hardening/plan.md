# sprint-004-ui-report-rollout-and-hardening 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`

## 1. Sprint Goal

把 agent 视图接入 CLI / report / diagnostics，并完成集成测试、smoke 门禁与 adoption 指南。

## 2. Task Package

1. `TK-324` 让 CLI/report 输出 agent 视图。
2. `TK-325` 增加集成测试与 smoke 门禁。
3. `TK-326` 输出使用文档与 adoption 指南。

## 3. Exit Criteria

1. CLI/report/review 输出已具备 agent 级视图、session projection 与执行上下文。
2. onboarding / projection / LangGraph 编排与关键回退路径已通过目标测试与 `pnpm run build`。
3. 外部 adopter 可按最小路径完成 `connect -> doctor --adapters -> verify --adapters -> run --dry-run --trace` 接入与验证。

## 4. Execution Notes

1. 2026-03-30：`CliOutputPresenter`、`run`/`connect`/`doctor`/`verify`/`review` 命令与 `packages/reporting` 已统一接入 `agentView`。
2. 2026-03-30：已新增/扩展 `core-agent-projection`、LangGraph supervisor、report builder、CLI runtime 的目标单测/集成测，配合 `pnpm run build` 完成收尾。
3. 2026-03-30：README、`README.zh-CN.md`、`docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md` 已切换到真实 onboarding 口径，并补充 candidate config artifact / safe-local repair / agent-view 说明。
4. 2026-03-30：本 sprint 同时产出 project-level resolved review 与 completion audit；`current-context` 现保留本 sprint 作为 completed closeout surface。
