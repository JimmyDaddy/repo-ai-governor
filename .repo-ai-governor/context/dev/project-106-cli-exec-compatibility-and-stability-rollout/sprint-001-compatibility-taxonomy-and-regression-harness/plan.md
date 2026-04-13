# sprint-001-compatibility-taxonomy-and-regression-harness 计划

- Status: planned
- Date: 2026-04-14
- Sprint Goal: 建立 native `cli_exec` scenario-class compatibility harness 与 preserved-facts assertions。
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
  - `.repo-ai-governor/context/dev/project-100-cli-exec-compatibility-and-stability-promotion/sprint-001-formalization-and-promotion-cutover/tasks/DA-842-cli-exec-compatibility-and-stability-promotion-cutover.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 1. Scope

1. 建立 `spawn_failed / parse_failed / non_zero_exit / signal_exit / timeout_* / abort_*` 的 scenario-class harness。
2. 固定 `launch_diagnostics_preserved / adapter_launch_truth_projected / terminate_phase_preserved / partial_output_preserved_when_available` 断言边界。
3. 对齐 `Codex / Claude Code / GitHub Copilot` smoke 与 onboarding/routing 测试，使其消费同一 compatibility taxonomy。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-861 | establish native cli_exec scenario-class compatibility harness and preserved-facts assertions | DA-842 | planned |
| TK-862 | align codex claude-code github-copilot smoke plus onboarding routing tests to the compatibility taxonomy | TK-861 | planned |
| TK-863 | sprint-001 exit acceptance and sprint-002 activation handoff | TK-861、TK-862、activation-time local CR-001 | planned |

## 3. Exit Criteria

1. compatibility harness 与 preserved-facts assertion matrix 已被拆成真实 implementation boundary。
2. cross-adapter smoke/onboarding/routing coverage 已明确挂到 compatibility taxonomy，而不是留在零散 adapter-local 断言里。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 `sprint-002` handoff 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 只处理 compatibility baseline，本轮不引入新的 public transport/support wording。
3. 在 `project-106` clean closeout 前，不得把 compatibility profile 声称为新的 `governance.execution-gates` formal truth。
