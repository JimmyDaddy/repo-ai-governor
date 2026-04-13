# TK-830 add guardrails so ACP remains additive non-default and non-public without a separate solution

- Status: planned
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint: `sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout`

## 1. 任务目标

补齐治理 guardrail，确保 ACP 在没有新 solution 的情况下仍保持 additive、non-default、non-public。

## 2. Depends On

1. `TK-829`

## 3. 预期产物

1. ACP governance guardrail
2. explicit non-public boundary
3. future-solution interlock

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`

## 5. 实施计划

1. 明确 ACP 不可被 presenter / docs / support wording 误表述成当前正式 transport。
2. 明确 host-facing ACP surface、distribution contract 与 public support uplift 都需要新的 technical solution。
3. 为 project closeout 的 delivery evidence 准备清晰的 governance verdict。

## 6. Development Verification

1. `pnpm run build`
2. targeted governance and docs verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. 执行记录

1. 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 `TK-829` 完成后执行。
