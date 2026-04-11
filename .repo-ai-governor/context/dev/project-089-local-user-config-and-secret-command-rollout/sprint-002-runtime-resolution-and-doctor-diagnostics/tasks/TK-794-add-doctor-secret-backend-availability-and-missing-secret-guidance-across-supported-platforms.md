# TK-794 add doctor secret-backend availability and missing-secret guidance across supported platforms

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P1
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint: `sprint-002-runtime-resolution-and-doctor-diagnostics`

## 1. 任务目标

让 `doctor` 能诊断 secret backend availability、missing secret、unsafe fallback status 与跨平台 guidance，同时保持 analyze-first boundary。

## 2. Depends On

1. `TK-793`

## 3. 预期产物

1. doctor diagnostics baseline
2. supported-platform guidance
3. next_action truthfulness

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 5. 实施计划

1. 增加 backend availability 与 missing secret 诊断。
2. 覆盖 macOS / Windows / Linux guidance。
3. 保持 doctor 不做隐式修复。

## 6. Development Verification

1. `pnpm run build`
2. targeted doctor tests

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-11：任务通过 `DA-786` 创建，当前保持 `planned`，等待 `TK-793` 完成后执行。
2. 2026-04-12：已完成 doctor secret-backend availability / missing-secret diagnostics、warning-bearing default backend truthfulness、unsafe fallback guidance 与 successful `credentialRef` selector/back-end evidence 保留，并通过 focused doctor/adapter regression coverage 与 `CR-003` clean recheck。

## 9. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-089-local-user-config-and-secret-command-rollout/sprint-002-runtime-resolution-and-doctor-diagnostics/plan.md`
