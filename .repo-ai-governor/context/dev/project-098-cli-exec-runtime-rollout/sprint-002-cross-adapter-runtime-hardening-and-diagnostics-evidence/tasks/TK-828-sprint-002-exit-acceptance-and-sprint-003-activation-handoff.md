# TK-828 sprint-002 exit acceptance and sprint-003 activation handoff

- Status: planned
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P1
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence`

## 1. 任务目标

在 `TK-825 ~ TK-827` clean 收口后，完成 sprint-002 exit acceptance，并把 execution surface 切换到 sprint-003。

## 2. Depends On

1. `TK-825`
2. `TK-826`
3. `TK-827`

## 3. 预期产物

1. sprint-002 exit acceptance packet
2. sprint-003 activation handoff
3. updated delivery / evidence truth

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/plan.md`

## 5. 实施计划

1. 汇总 cross-adapter runtime convergence 与 diagnostics evidence。
2. 判断 rollout 是否已具备进入 ACP seam guardrail阶段的前置条件。
3. 激活 sprint-003，并保持 public ACP support 仍未开放。

## 6. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 7. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 sprint-002 clean 收口后执行。
