# TK-574 freeze structured projection registry and host export manifest contract

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-574`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-structured-projection-and-project-local-export-baseline`
- Project: `project-050-governance-surface-clients-host-distribution-rollout`

## 1. 目标

冻结 structured projection registry、`host-export.manifest.json` 与 staged/apply 基线，建立后续 renderer 与 verify 的共同契约。

## 2. Expected Outputs

1. structured projection registry schema
2. `host-export.manifest.json` contract
3. staged/apply state model baseline

## 3. Execution Notes

1. 2026-04-06：任务创建，等待 sprint-001 激活。
2. 2026-04-06：随 `sprint-001` 激活切换为 `active`，当前窗口先补齐 shared host distribution contract/runtime types，并把 CLI host command scaffold 与 renderer contract 接入现有 seam owner。
3. 2026-04-06：已冻结 `packages/standards` host distribution constants/types/registry，以及 `governance-host-distribution-contract.md` / ADR / module overview 的正式契约面。
