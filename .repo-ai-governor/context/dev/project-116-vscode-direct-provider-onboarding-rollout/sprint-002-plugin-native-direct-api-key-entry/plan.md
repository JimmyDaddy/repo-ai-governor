# sprint-002-plugin-native-direct-api-key-entry 计划

- Status: completed
- Date: 2026-04-20
- Sprint Goal: Land plugin-native direct API key entry, managed secret write, and non-secret provider config persistence.
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Upstream:
  - `.repo-ai-governor/draft/approved_solution_review_vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/provider-onboarding-and-direct-api-key-entry-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`

## 1. Scope

1. Implement plugin-native provider/model/endpoint/API-key entry with secure capture.
2. Persist managed secret + credentialRef and non-sensitive provider config through an explicit mutation seam.
3. Verify activation/connect paths no longer require credentialEnvVar for the plugin human path.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1007 | implement plugin-native direct api key entry and secure capture | prepare sprint-001 handoff and activation recommendation | completed |
| TK-1008 | persist managed secret credentialRef and provider config through explicit mutation seam | implement plugin-native direct api key entry and secure capture | completed |
| TK-1009 | verify plugin human path exits env-var-first onboarding | persist managed secret credentialRef and provider config through explicit mutation seam | completed |
| TK-1020 | close sprint-002 boundary and activate sprint-003 execution surface | CR-001 reviewer-clean handoff | completed |

## 3. Exit Criteria

1. Plugin-native direct API key entry, managed secret write, and credentialRef persistence are implemented with targeted verification evidence.
2. The plugin human path no longer depends on credentialEnvVar authoring.

## 4. Sprint Notes

1. Human-path improvement must not remove CLI/CI/headless credentialEnvVar compatibility.
2. `2026-04-20`：`sprint-001-contract-and-provider-onboarding-facade` 已在 `CR-001` resolved 与 `TK-1019` closeout write-back 后进入 completed history；当前 sprint 已切换为 active primary surface，`TK-1007` 成为新的 `in_progress` execution boundary。
3. `2026-04-20`：`TK-1007 ~ TK-1009` 已在同一变更窗口完成并拿到 targeted tests + `pnpm run build` + `pnpm run test:packages` 证据；下一步进入 sprint-002 CR bootstrap / delegated review loop。
4. `2026-04-20`：`CR-001` 已收口到 `resolved`；当前已创建 `TK-1020` 作为 sprint-002 closeout task，下一步切换 primary execution surface 到 `sprint-003-readiness-cta-and-provider-lifecycle`。
5. `2026-04-20`：`TK-1020` 已完成 closeout write-back；当前 sprint 正式收口为 `completed`，primary execution surface 已切换到 `sprint-003-readiness-cta-and-provider-lifecycle`。
