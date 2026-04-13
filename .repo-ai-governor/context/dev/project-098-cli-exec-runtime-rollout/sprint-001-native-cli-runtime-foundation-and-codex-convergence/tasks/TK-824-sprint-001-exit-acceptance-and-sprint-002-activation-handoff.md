# TK-824 sprint-001 exit acceptance and sprint-002 activation handoff

- Status: planned
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P1
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-001-native-cli-runtime-foundation-and-codex-convergence`

## 1. 任务目标

在 `TK-821 ~ TK-823` clean 收口后，完成 sprint-001 exit acceptance，并把 execution surface 切换到 sprint-002。

## 2. Depends On

1. `TK-821`
2. `TK-822`
3. `TK-823`

## 3. 预期产物

1. sprint-001 exit acceptance packet
2. sprint-002 activation handoff
3. updated project / sprint truth

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/plan.md`

## 5. 实施计划

1. 汇总 sprint-001 runtime convergence evidence。
2. 判断 shared runtime owner 是否足够稳定，允许进入 cross-adapter cutover。
3. 以 handoff 形式激活 sprint-002，并保留 `cli_exec` canonical truth 不变。

## 6. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 7. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 sprint-001 clean 收口后执行。
