# TK-827 harden Unix and Windows process-tree termination plus additive diagnostics evidence across adapters

- Status: active
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence`

## 1. 任务目标

补齐 Unix / Windows process-tree termination hardening，并为 additive diagnostics 产出 cross-adapter evidence。

## 2. Depends On

1. `TK-826`

## 3. 预期产物

1. cross-platform process-tree hardening
2. additive diagnostics evidence
3. shared runtime cross-adapter proof

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`

## 5. 实施计划

1. 收敛 Unix process group 与 Windows `taskkill /T` 风格的 process-tree handling。
2. 证明 `entrypoint_resolution / shell_wrapped / process_tree_policy / spawn_error_code` 只作为 additive diagnostics 出现。
3. 形成适合后续 closeout 与 delivery write-back 的 evidence packet。

## 6. Development Verification

1. `pnpm run build`
2. targeted adapter regression and cross-platform diagnostics verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 `TK-826` 完成后执行。
2. 2026-04-13：随着 `TK-824` 完成，任务状态切换为 `active`；当前 boundary 已进入 sprint-002 primary execution surface，下一步推进 cross-platform process-tree hardening、additive diagnostics evidence 汇总与 fresh reviewer CR loop。
