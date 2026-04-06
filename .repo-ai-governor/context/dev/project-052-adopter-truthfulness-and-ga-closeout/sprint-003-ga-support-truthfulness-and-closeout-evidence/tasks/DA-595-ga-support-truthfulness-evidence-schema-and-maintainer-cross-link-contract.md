# DA-595 ga support truthfulness evidence schema and maintainer cross-link contract

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Artifact ID: `DA-595`
- Produced By: `TK-595`
- Scope: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. Freeze Summary

1. `project-052` 的 sprint-003 不再新建平行的 GA truth doc；统一 closeout truth surface 冻结为 `docs/support-matrix.md` 与 `docs/support-matrix.zh-CN.md`。
2. `docs/maintainer-validation-playbook*.md` 保留为 maintainer runbook 与 backlink router，不再独立承载“当前支持状态”的正式声明。
3. `docs/ga-readiness-evidence*.md` 继续保留 program-level signal matrix 角色；它可以引用 `project-052` 刷新的 support truth，但不重复定义新的 support 边界。

## 2. Canonical Surface Contract

### 2.1 Support Matrix Owns The Public Claim

1. `docs/support-matrix*.md` 是 adopter-facing 与 maintainer-readable 的唯一正式支持声明面。
2. `TK-596` 必须把 GA support truthfulness 相关的 closeout snapshot 写进 support matrix，而不是只留在 handoff artifact 或 maintainer playbook。
3. support matrix 中的相关 snapshot 至少要覆盖：
   - 当前支持边界
   - maintainer validation backlink
   - release / clean-room / repo-external evidence backlink
   - closeout verdict 与 residual risk

### 2.2 Maintainer Playbook Owns The Runbook And Backlinks

1. `docs/maintainer-validation-playbook*.md` 负责说明“维护者怎么验证”，不重复维护正式 support status。
2. playbook 必须直接回链：
   - `docs/support-matrix*.md` 中的 GA support truthfulness snapshot
   - `docs/ga-readiness-evidence*.md`
   - 关键结构化报告（例如 `.tmp/project-052-sprint-001-cleanroom-report.json`、`.tmp/project-052-sprint-001-local-distribution-report.json`、`.tmp/project-052-sprint-002-command-rehearsal-summary.json`）
3. playbook 若给出命令列表，应把它们描述为 maintainer validation runbook，而不是新的 support contract。

### 2.3 GA Readiness Evidence Stays Program-Level

1. `docs/ga-readiness-evidence*.md` 继续承载跨 sprint / 跨阶段的 GA signal matrix。
2. 当 `project-052` 刷新 support truth 时，GA evidence 文档最多追加 backlink 或 refresh note，不独立复写 support boundary。
3. 若 program-level signal 与 support matrix snapshot 冲突，以 support matrix 中最新的 formal support declaration 为准，并在 GA evidence 文档中补 backlink 说明。

## 3. Frozen Evidence Schema For TK-596

| Field | Required | Meaning | Frozen owner |
|---|---|---|---|
| `claim_scope` | Yes | 当前结论覆盖的用户面，例如 `adopter support`, `maintainer validation`, `project closeout` | `support-matrix*.md` |
| `audience` | Yes | `adopter` / `maintainer` / `project-closeout` | `support-matrix*.md` |
| `surface` | Yes | 对应 surface，例如 `install modes`, `upgrade/workspace`, `GA support truthfulness` | `support-matrix*.md` |
| `status` | Yes | `Pass` / `Warn` / `Conditional` / `Blocked` 等 closeout 语义 | `support-matrix*.md` |
| `evidence_time_utc` | Yes | 证据执行或快照时间 | `support-matrix*.md` |
| `evidence_command_or_artifact` | Yes | 命令或结构化证据文件名 | `support-matrix*.md` |
| `evidence_summary` | Yes | 用一句话说明为什么这条证据足以支撑该 claim | `support-matrix*.md` |
| `backlink_target` | Yes | 回链到 runbook、GA evidence 或 task artifact 的路径 | `support-matrix*.md` |
| `refresh_trigger` | Yes | 哪类变化会使该结论失效，例如支持边界变化、命令链变化、release gate 改动 | `DA-595` / follow-up task artifacts |
| `residual_risk` | Optional | 仍保留但不阻断 closeout 的风险 | `support-matrix*.md` |

## 4. Frozen Cross-link Set

1. clean-room packaged-install evidence：
   - `.tmp/project-052-sprint-001-cleanroom-report.json`
2. local distribution / packaged rehearsal evidence：
   - `.tmp/project-052-sprint-001-local-distribution-report.json`
3. repo-external upgrade / workspace closeout evidence：
   - `.tmp/project-052-sprint-002-command-rehearsal-summary.json`
4. maintainer runbook：
   - `docs/maintainer-validation-playbook.md`
   - `docs/maintainer-validation-playbook.zh-CN.md`
5. program-level GA evidence：
   - `docs/ga-readiness-evidence.md`
   - `docs/ga-readiness-evidence.zh-CN.md`

## 5. Guardrails For TK-596

1. 不要把 `README*` 或 `docs/local-adoption-playbook*.md` 升级为新的 GA closeout truth surface；它们继续保持最小 adopter 入口与操作路径说明。
2. 不要在 `docs/maintainer-validation-playbook*.md` 中复制整张 support matrix；maintainer playbook 只保留执行步骤和 backlinks。
3. 不要把 `.tmp` 结构化报告变成用户直接阅读的主文档；它们只作为 evidence backlink。
4. 若 `project-052` 的新 closeout 结论会影响 `project-053 ~ project-056/057` 的 planned stream assumptions，必须在 `TK-597` 中回写 next-stream recommendation。

## 6. Validation

1. `rg -n "support matrix|maintainer validation|ga-readiness" docs/support-matrix.md docs/support-matrix.zh-CN.md docs/maintainer-validation-playbook.md docs/maintainer-validation-playbook.zh-CN.md docs/ga-readiness-evidence.md docs/ga-readiness-evidence.zh-CN.md`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`

## 7. Next Boundary

1. `TK-596` 依据本 schema 在 `docs/support-matrix*.md` 中实现统一的 GA support truthfulness snapshot。
2. `TK-596` 同步把 `docs/maintainer-validation-playbook*.md` 改为明确 backlink 到 support matrix 与 GA evidence。
3. `TK-597` 在 project closeout 时复用同一 schema 产出 completion audit summary 与 next-stream recommendation。
