# sprint-002-plugin-native-direct-api-key-entry 计划

- Status: planned
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
| TK-1007 | implement plugin-native direct api key entry and secure capture | prepare sprint-001 handoff and activation recommendation | planned |
| TK-1008 | persist managed secret credentialRef and provider config through explicit mutation seam | implement plugin-native direct api key entry and secure capture | planned |
| TK-1009 | verify plugin human path exits env-var-first onboarding | persist managed secret credentialRef and provider config through explicit mutation seam | planned |

## 3. Exit Criteria

1. Plugin-native direct API key entry, managed secret write, and credentialRef persistence are implemented with targeted verification evidence.
2. The plugin human path no longer depends on credentialEnvVar authoring.

## 4. Sprint Notes

1. Human-path improvement must not remove CLI/CI/headless credentialEnvVar compatibility.
