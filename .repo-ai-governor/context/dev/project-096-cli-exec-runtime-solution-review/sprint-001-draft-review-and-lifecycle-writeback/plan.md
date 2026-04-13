# sprint-001-draft-review-and-lifecycle-writeback 计划

- Status: completed
- Date: 2026-04-13
- Sprint Goal: 完成 cli-exec runtime draft 的正式 review、lifecycle write-back 与 docs-only closeout。
- Upstream:
  - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/transport-selection-authority-and-strict-transport-routing.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`

## 1. Scope

1. 建立 review baseline，判断该 draft 是否满足批准前提。
2. 落盘 canonical review artifact，并同步 lifecycle registry。
3. 完成 docs-only 任务台账与 completion audit 收口。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-833 | review cli-exec runtime hardening and explicit ACP extension seam technical solution draft | review baseline | completed |
| TK-834 | finalize project-096 closeout and restore idle context | TK-833 | completed |

## 3. Sprint Notes

1. 本 sprint 只处理 review 与 lifecycle write-back，不改 draft 本身。
2. 本 sprint 不创建 `CR-xxx`，因为这里的主产物是 technical-solution review artifact，而不是 code-review lifecycle。
3. closeout 结论必须明确“review completed != solution promoted”。
