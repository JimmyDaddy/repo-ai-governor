# sprint-002-playbook-readback-and-support-evidence-prep 计划

- Status: active
- Date: 2026-04-14
- Sprint Goal: 推进 playbook readback、support evidence preparation，并完成 rollout closeout。
- Project: `project-104-cli-exec-onboarding-adoption-readiness-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-001-onboarding-adoption-readiness-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`

## 1. Scope

1. 将 readiness evidence chain 应用到 local adoption readback 与 playbook-consumer surfaces。
2. 准备 support-evidence package 与 guardrails，但不默认 uplift support-matrix truth。
3. 在 sprint final clean 后完成 `project-104` closeout 与 delivery evidence handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-879 | apply the readiness evidence chain to local adoption readback and playbook-consumer surfaces | TK-878 | in_progress |
| TK-880 | prepare support-evidence package and guardrails without uplifting support-matrix truth by default | TK-879 | planned |
| TK-881 | finalize project-104 closeout and delivery evidence handoff | TK-879、TK-880、activation-time local CR-001 | planned |

## 3. Exit Criteria

1. local adoption readback 与 playbook-consumer surfaces 已拥有明确的 readiness evidence 消费路径。
2. support-evidence package 已形成真实 rollout boundary，但 support-matrix truth 仍保持 evidence-gated。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 project-final closeout 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 只承接 playbook readback、support evidence 与 closeout，不直接 uplift public support wording。
3. `TK-881` 负责 `project-104` final closeout，但只有在 sprint-002 local `CR-001` clean 后才允许完成。
4. 2026-04-14：`sprint-001` clean closeout 已完成，当前 sprint 已切换为 active primary surface；`TK-879` 进入 `in_progress`，下一步先本地预留 `CR-001` 再开始 playbook readback implementation。
