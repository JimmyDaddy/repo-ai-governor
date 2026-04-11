# TK-792 resolve credentialRef through secret backends and preserve env precedence

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint: `sprint-002-runtime-resolution-and-doctor-diagnostics`

## 1. 任务目标

把 `credentialRef` 从 manual-only truth 升级为真实 secret-backend resolution seam，并保持 `credentialEnvVar` 的既有优先级和兼容行为。

## 2. Depends On

1. `TK-790`

## 3. 预期产物

1. credentialRef runtime resolution seam
2. env precedence compatibility baseline
3. secret-backend read-only consumption baseline

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`

## 5. 实施计划

1. 接通 secret backend read-only resolution。
2. 保持 `credentialEnvVar` 兼容与 precedence truth。
3. 缺 secret 时输出 guidance，而不是隐式修复。

## 6. Development Verification

1. `pnpm run build`
2. targeted adapter/runtime tests

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-11：任务通过 `DA-786` 创建，当前保持 `planned`，等待 sprint-002 激活。
2. 2026-04-12：随着 `TK-791 / DA-791` 完成 sprint-001 closeout 与 activation handoff，当前任务切换为 `in_progress`，开始接通 `credentialRef` runtime resolution seam。
3. 2026-04-12：已完成 codex / claude remote-api `credentialRef` read-only resolution seam、env precedence 保持与 verification artifact credential-reference tracking，并通过 `pnpm run build`、sprint-002 focused verification suite 与 `CR-003` clean recheck。

## 9. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-089-local-user-config-and-secret-command-rollout/sprint-002-runtime-resolution-and-doctor-diagnostics/plan.md`
