# Governance Host Distribution Contract

- Status: active
- Date: 2026-04-06
- Contract ID: `contract.runtime.governance-host-distribution.v1`
- Producer Module: `runtime.governance-clients`

## 1. 目标

定义 `Codex`、`Claude Code` 与 `GitHub Copilot` 的 host-native distribution target、`staged export -> apply/sync -> pack -> verify` 生命周期，以及 Copilot target-aware consumption 约束，确保 exported assets 只是 canonical workflow source 的薄投影。

## 2. Minimum Fields

1. `host`
2. `mode`
3. `target`
4. `staged_export_root`
5. `discovery_state`
6. `semantic_owner_module`
7. `canonical_source_refs`
8. `source_pack_refs`
9. `workflow_ids`
10. `export_manifest_path`
11. `apply_report_path`
12. `verification_summary`
13. `handoff_bridge`
14. `target_capabilities`

## 3. Allowed Values

1. `host`
   - `codex`
   - `claude-code`
   - `github-copilot`
2. `mode`
   - `project-local`
   - `plugin-bundle`
3. `target`
   - `codex.project_local`
   - `codex.plugin`
   - `claude_code.project_local`
   - `claude_code.plugin`
   - `github_copilot.repo_local`
   - `github_copilot.cli_plugin`
   - `github_copilot.github_com_agent`
4. `discovery_state`
   - `staged_export`
   - `host_discoverable`
   - `installed_bundle`
5. `handoff_bridge`
   - `cli_wrapper`
   - `mcp`

## 4. Required Constraints

1. `staged_export_root` 只能代表 export workspace，不得被当作宿主已经开始消费的 project-local path。
2. `mode=project-local` 时，只有在 apply/sync 步骤把 staged export 物化到目标仓库真实宿主路径后，`discovery_state` 才能进入 `host_discoverable`。
3. `mode=plugin-bundle` 时，允许直接从 staged export 打包为 installable bundle；此路径不要求 repo apply，但 verify 必须确认 bundle manifest 与 canonical source 回链完整。
4. 所有 target 都必须回链 `canonical_source_refs` 与 `source_pack_refs`；exported skill / instruction / agent / hook 文本不得成为新的业务版本真值。
5. `host export` 必须生成 `host-export.manifest.json`；若执行 apply/sync，还必须生成 `host-apply.report.json` 或等价 apply report。
6. `host verify` 必须同时验证：
   - target 对应的宿主目录结构
   - `canonical_source_refs` 一致性
   - staged export 与 applied assets 的 drift
   - `GitHub Copilot` target 与消费面匹配
7. `GitHub Copilot` 的 `target` 不得省略：
   - `github_copilot.repo_local` 用于 `.github/copilot-instructions.md`、`.github/instructions/**`、`.github/skills/`、`.github/agents/`、`AGENTS.md` 与可选 `.github/mcp.json`
   - `github_copilot.cli_plugin` 用于 Copilot CLI installable bundle
   - `github_copilot.github_com_agent` 在 `v1` 中保留 schema，但不属于 MVP 必达导出目标
8. verify 必须显式阻断已停用的 `GitHub App Copilot Extensions` 路径，不得把其作为合法 target。
9. host-native enhancement 缺失时，所有 target 都必须能回退到 `cli_wrapper` baseline，而不是静默绕过治理主链。

## 5. Consumers

1. `packages/standards`
2. `packages/adapters/codex`
3. `packages/adapters/claude-code`
4. `packages/adapters/github-copilot`
5. `integrations/ide`
6. `runtime.agent-projection`
7. `service-host`

## 6. Compatibility

1. `v1` formalize 的是 host target matrix、export/apply/pack/verify 语义与 Copilot target dimension，不要求首轮实现已覆盖所有 advanced host enhancements。
2. `v1` 的 `GitHub Copilot` MVP 只要求 `repo_local + cli_plugin`，并保留 `github_com_agent` 作为后续 schema-safe 扩展位。
3. `v1` 允许 workflow 先通过 `cli_wrapper` bridge 落地，再在后续 sprint 中升级到 `mcp` bridge。
