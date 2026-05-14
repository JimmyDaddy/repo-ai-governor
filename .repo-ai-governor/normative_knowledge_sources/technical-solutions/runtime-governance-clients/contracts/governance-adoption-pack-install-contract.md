# Governance Adoption Pack Install Contract

- Status: active
- Date: 2026-04-15
- Contract ID: `contract.runtime.adoption-pack-install.v1`
- Producer Module: `runtime.governance-clients`

## 1. 目标

定义 installer-layer `adoption pack` 的 manifest、install receipt、managed ownership、target-repo bootstrap 与 `self-host-complete` 高级模板路径，确保 adopter 可以把一整套治理能力安全植入目标仓库，而不会把 host projection、installer metadata 与 runtime canonical state 混成一层真值。

## 2. Minimum Fields

### 2.1 Pack Manifest

1. `schema_version`
2. `pack_id`
3. `pack_version`
4. `status`
5. `owner_module`
6. `source_kind`
7. `source_ref`
8. `profiles`
9. `managed_asset_groups`
10. `managed_paths`
11. `canonical_source_refs`
12. `source_pack_refs`
13. `host_targets`
14. `handoff_bridge`
15. `verification_profile_refs`
16. `upgrade_policy`
17. `remove_policy`
18. `docs_entrypoints`

### 2.2 Profile Payload

1. `profile_id`
2. `display_name`
3. `workflow_asset_ids`
4. `command_entrypoints`
5. `guide_entrypoints`
6. `standards_pack_refs`
7. `host_targets`
8. `bootstrap_actions`
9. `workspace_mode_policy`

### 2.3 Install Receipt

1. `installation_id`
2. `pack_id`
3. `pack_version`
4. `applied_profile_id`
5. `workspace_mode`
6. `managed_file_records`
7. `source_resolution`
8. `verification_summary`
9. `installed_at`
10. `last_updated_at`
11. `ownership_class`
12. `drift_policy`
13. `git_policy`
14. `placeholder_policy`

## 3. Allowed Values

1. `source_kind`
   - `built_in`
   - `global`
   - `repo_local`
2. `workspace_mode`
   - `tool_managed`
   - `repo_local`
3. `workspace_mode_policy`
   - `tool_managed_default`
   - `repo_local_opt_in`
   - `repo_local_required`
4. `managed_asset_groups`
   - `command_guides`
   - `instructions`
   - `skills`
   - `agents`
   - `hooks`
   - `wrappers`
   - `mcp_bridge`
   - `bootstrap_templates`
   - `runtime_handoff_metadata`
   - `management_metadata`
   - `normative_templates`
   - `execution_templates`
   - `sqlite_registries`
   - `governance_authoring_templates`
5. `upgrade_policy`
   - `managed_only`
   - `managed_with_drift_report`
6. `remove_policy`
   - `managed_only`
   - `managed_with_confirm`
7. `ownership_class`
   - `managed_locked`
   - `starter_editable`
   - `canonical_runtime_writable`
   - `generated_ephemeral`

## 4. Required Constraints

1. `adoption pack` 只能组合现有 `Standards Pack`、workflow assets、host distribution metadata 与 bootstrap templates；不得创建新的平行规则 registry。
2. installer 默认只能物化 host-consumable projection、installer metadata、guide 与 bootstrap template；这些文件不得被表述为 workflow canonical source。
3. `workspace_mode=tool_managed` 时，repo-visible `.repo-ai-governor/**` 只能承载 adoption metadata、guide 与 reference/template，不得静态下发 runtime operational truth。
4. `workspace_mode=repo_local` 只允许在显式选择的 profile 或 bootstrap action 下写入 repo-local canonical config；installer 不得隐式切换工作区真值。
5. `self-host-complete` 只允许作为显式高级 profile，且必须同时满足：
   - `workspace_mode=repo_local`
   - installer 只 seed template-backed canonical surface
   - norm-source、execution workspace、sqlite registry 与 governance authoring surface 必须是空白或模板化初始态
6. `self-host-complete` 不得复制源仓库 live-state snapshot，包括活跃 `project/sprint/review/artifact` 数据、历史 artifact rows 或其他 execution trace。
7. `adopt apply` 必须产出 install receipt，并记录 managed ownership；`adopt upgrade/remove` 只能自动处理 managed records，检测到 drift 时必须显式报出。
8. host-specific project-local assets、installable bundle 与 target-aware verify 仍由 `contract.runtime.governance-host-distribution.v1` 的 lower-level lifecycle 承担；installer 只是在更高层 orchestrate 这些子链。
9. `.codex/skills/**` 可作为 repo-local override 或 authoring input，但不得继续被要求为 adopter install 的前置目录。
10. `self-host-complete` seed 的 repo-specific governance / product / execution starter docs（例如 `code_standards.md`、`long-term-maintenance-guide.md`、`product-requirements-brief.md`、project / sprint / task starter docs）只能是 adopter-owned placeholder 或 template content；installer 不得把源仓库 live authoring truth 镜像到目标仓库。
11. 与上述 placeholder surface 相关的 readiness interlock 只允许在 self-host authoring / execution path 生效；默认 `adopter-complete` 安装路径不得因为缺少 repo-local governance、product 或 execution docs 而被 `warn` 或 `fail_closed`。
12. 对于 `current-context.md`、`normative-loading-manifest.yaml` 这类需要“结构同步 + starter instance”分离的 surface，installer 只能物化 filtered/template projection，不得做 unconditional whole-file sync。
13. public installer convenience entry（例如 `adopt bootstrap`）可以编排 `init`、`doctor --fix`、`adopt apply` 与 `adopt verify`，但 install receipt 与 verification summary 仍是唯一 canonical install truth。
14. convenience entry 不得把 broader governance audit `check` 吞并为 install result 的隐式前置或唯一 follow-up；`check` 继续作为显式治理审计 surface。
15. 当 convenience entry 省略 pack selector 时，只允许回落到官方 built-in pack；显式 selector 解析必须复用现有 `pack-id -> profile-id` fallback 语义，并在目标不唯一时 fail-closed。
16. 当目标仓库已存在 install receipt 时，convenience rerun 只允许在 `pack_id/applied_profile_id` 匹配且 managed files 干净时复用现有安装；出现 drift、pack mismatch 或 profile mismatch 时，必须显式重定向到 `adopt diff/upgrade/remove`，不得静默变成 upgrade 或 cross-pack migration。
17. empty-repo `self-host-complete + repo_local` path 下，bootstrap transaction 内的 config seed 与 `adopt apply` 必须保持同一事务语义；installer 不得先写出会被同窗口 managed apply 视为“未受管冲突”的 repo-local `governor.yaml`。
18. self-host template 必须提供最小可执行 baseline：至少让 `connect` 能进入 candidate-config path，而不是因缺少 `adapters` baseline 直接 fail-closed；默认 storage engine 也不得与后续 diagnostics 的“expected default”长期分叉。
19. `managed_file_records` 对 self-host path 不得再把所有 seeded surface 一律视作“后续必须保持 checksum 一致”的 managed drift。`starter_editable` 与 `canonical_runtime_writable` 必须只保留 provenance/placeholder 语义，不得把正常 authoring 或 runtime 演进误报为 installer drift。
20. `managed_locked`、`starter_editable`、`canonical_runtime_writable` 与 `generated_ephemeral` 必须绑定明确 lifecycle：
   - `managed_locked` 继续沿用严格 `diff/upgrade/remove` managed lifecycle。
   - `starter_editable` 只保留 seed provenance / placeholder policy；`upgrade` 不得默认覆盖用户编辑内容，`remove` 仅允许对 untouched seed auto-delete。
   - `canonical_runtime_writable` 只记录 seed provenance，不再要求和 seed checksum 持续一致；`upgrade` 只能做 migration / next-action hint，`remove` 不得静默删除当前 canonical truth。
   - `generated_ephemeral` 不进入 install drift / remove 主链，清理、轮转与归档属于 runtime housekeeping。
21. 对已安装 self-host 仓库，receipt 必须提供 migration/backfill 路径，把旧的统一 `managed=true` surface 回填到新的 ownership taxonomy；否则已落地仓库不得因为历史 receipt 结构继续保留错误 drift 行为。
22. generated diagnostics / reports / replay / compiled-ir / sqlite wal/shm 等 runtime 产物必须与 installer-owned canonical surfaces 分层；installer 最多提供 `.gitignore` recommendation block 或等价 opt-in append，不得静默改写 adopter 根 `.gitignore`。
23. self-host activation/readiness phase 必须只有一个 canonical producer：`adopt verify` 负责 install/self-host activation verdict 与 verification summary；`doctor` 只能反映最近一次 canonical phase 并叠加本机环境 / adapter readiness；`check` 只能消费 phase truth 做 broader governance audit。
24. installer-facing blocked signal 也必须与上述 owner split 对齐：install/self-host placeholder 阻断归 `adopt verify`，adapter/local-env/secret backend readiness 归 `doctor`，broader policy / governance audit 归 `check`。

## 5. Consumers

1. `apps/cli`
2. `packages/standards`
3. `packages/adapters/codex`
4. `packages/adapters/claude-code`
5. `packages/adapters/github-copilot`
6. `service-host`
7. `docs/local-adoption-playbook.md`

## 6. Compatibility

1. `v1` formalize 的是 installer-layer manifest / receipt / ownership / bootstrap boundary，而不是宣称所有 follow-up implementation 已经交付。
2. `v1` 允许 `adopter-complete` 先覆盖完整 adopter-facing capability surface，再由后续 sprint 逐步补齐 installer lifecycle、managed bundle、clean-room rehearsal 与 docs truthfulness。
3. `v1` 允许 `self-host-complete` 先 formalize 为官方治理模板路径，并把 template bootstrap 与 live-state clone 的边界写成 fail-closed contract。
4. `v1` 允许以 additive clarification 的方式补充 built-in pack parity 与 self-host placeholder readiness applicability boundary，而不要求新增 schema version。
5. `v1` 允许以 additive clarification 的方式 formalize installer convenience orchestration、explicit `check` follow-up、default built-in selector 与 clean rerun boundary，而不要求新增 schema version。
6. `v1` 允许以 additive clarification 的方式 formalize empty-repo self-host bootstrap transaction consistency、ownership taxonomy、generated artifact ignore policy 与 activation/readiness owner split，而不要求新增 schema version。
