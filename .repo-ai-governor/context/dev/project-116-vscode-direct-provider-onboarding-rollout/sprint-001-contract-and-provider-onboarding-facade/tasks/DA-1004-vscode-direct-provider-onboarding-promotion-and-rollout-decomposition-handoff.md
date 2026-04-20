# DA-1004 vscode direct provider onboarding promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-20
- Owner: AI-Agent
- Task: `TK-1004`
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-001-contract-and-provider-onboarding-facade`

## 1. Summary

1. `technical-solution.vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding` 已从 `approved` 推进为 `active` lifecycle-managed solution。
2. formal landing 已固定为 `runtime.governance-clients` 的 shared overview 增量，以及新的 producer contract `provider-onboarding-and-direct-api-key-entry-contract.md` 与 ADR `vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`。
3. implementation follow-up 已拆解为 `project-116-vscode-direct-provider-onboarding-rollout` 的五个 planned sprint。
4. 当前 active truth 只 formalize VS Code direct API key onboarding 的 owner split、explicit mutation seam、managed-secret persistence boundary 与 `credentialRef` selector strategy；不宣称插件 runtime、README/playbook wording、built-source/local-VSIX evidence 或 clean-room validation 已在本窗口完成。

## 2. Immediate Activation Recommendation

1. 下一条真正建议激活的 implementation stream 固定为 `project-116 / sprint-001-contract-and-provider-onboarding-facade`。
2. 第一批必须优先冻结：
   - direct API key entry 与 `connect / doctor / verify` 的 analyze-first 边界
   - `provider_onboarding snapshot / apply / receipt` facade 与默认 `credentialRef` selector
   - `runtime.governance-clients` 与 `runtime.agent-projection` 的 owner split、CTA mapping 与 fail-closed semantics
3. 在 `sprint-001` clean 收口前，不建议抢跑 direct-onboarding public wording uplift、local-VSIX support claim 或 zero-env-var clean-room claim。

## 3. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/provider-onboarding-and-direct-api-key-entry-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`
3. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/plan.md`
5. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/plan.md`
6. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-003-readiness-cta-and-provider-lifecycle/plan.md`
7. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/plan.md`
8. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/plan.md`
