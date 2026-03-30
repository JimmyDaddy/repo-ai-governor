# sprint-002-connect-apply-and-diagnostics-contract 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-030-runtime-agent-projection-phase-2-productization`
- Sprint Goal: 实现 `connect diff` / `connect apply`、candidate diff / merge explain artifacts、rollback snapshot 与 apply receipt，并把 `connect` 正式补齐为可审阅、可应用、可回滚的 adopter workflow。

## 1. Task Package

1. `TK-424` implement connect diff, apply, and rollback receipt workflow
2. `TK-425` emit candidate diff and merge explain artifacts

## 2. Exit Criteria

1. `connect` 默认仍保持 non-mutating analyze-first 行为。
2. `connect` 默认输出 candidate config、diagnostics、diff summary 与 merge explain companion artifacts。
3. `connect diff` 可消费显式 candidate path 或 `--latest` 并返回可审阅 diff artifacts。
4. `connect apply` 会校验 candidate/source fingerprint、生成 rollback snapshot、写回活动 `governor.yaml` 并产出 apply receipt。
5. 相关 CLI output / JSON contract / tests 与 build evidence 已同步通过。

## 3. Milestones

1. 2026-03-30：激活 `sprint-002`，将 `current-context` 主执行面切到 connect/apply implementation。
2. 2026-03-30：完成 `TK-424` 与 `TK-425`，落地 `connect diff/apply`、candidate diff JSON/Markdown、merge explain、rollback snapshot、apply receipt，并通过 targeted tests + `pnpm run build`。
