# TK-831 produce regression and evidence packets for native cli_exec convergence and ACP seam non-regression

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout`

## 1. 任务目标

为 shared native `cli_exec` convergence 与 ACP seam non-regression 产出可回链的 regression / evidence packet。

## 2. Depends On

1. `TK-830`

## 3. 预期产物

1. native `cli_exec` convergence evidence
2. ACP seam non-regression evidence
3. delivery closeout packet

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`

## 5. 实施计划

1. 汇总 targeted runtime / adapter / diagnostics / closeout evidence。
2. 证明 ACP seam 没有反向改写 canonical transport truth 或 public support wording。
3. 为 `TK-832` 的 final closeout 写回提供 deterministic evidence list。

## 6. Development Verification

1. `pnpm run build`
2. targeted regression and evidence verification suite

## 7. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 `TK-830` 完成后执行。
2. 2026-04-13：随着 `TK-828` 完成，任务状态切换为 `active`；当前围绕 seam unit test、config public-boundary guardrail test 与 package-level non-regression suite 收敛 evidence packet，等待 sprint-003 delegated CR。
3. 2026-04-13：`CR-001` clean 收口后，ACP seam non-regression 与 native `cli_exec` convergence evidence 已具备 project-final review 前置条件，本任务收口为 `completed`。
