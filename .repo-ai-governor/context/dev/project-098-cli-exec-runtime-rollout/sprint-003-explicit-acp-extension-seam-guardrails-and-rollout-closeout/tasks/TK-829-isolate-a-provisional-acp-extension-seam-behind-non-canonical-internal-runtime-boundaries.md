# TK-829 isolate a provisional ACP extension seam behind non-canonical internal runtime boundaries

- Status: planned
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout`

## 1. 任务目标

把 ACP 相关能力隔离为 provisional internal seam，避免它污染当前 canonical `cli_exec` truth。

## 2. Depends On

1. `TK-827`

## 3. 预期产物

1. internal ACP seam isolation
2. non-canonical runtime boundary
3. explicit future extension point

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
2. `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts`

## 5. 实施计划

1. 把 ACP-related dependency and event handling seam 限定在 internal boundary。
2. 不新增 public transport truth，不复用 `cli_exec` 名义承载 ACP path。
3. 让 future ACP work 仍可在不污染当前 runtime truth 的前提下增量接入。

## 6. Development Verification

1. `pnpm run build`
2. targeted runtime seam verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 sprint-003 激活后执行。
