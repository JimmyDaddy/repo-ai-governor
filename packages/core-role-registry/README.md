# @repo-ai-governor/core-role-registry

- Status: baseline
- Date: 2026-03-21
- Scope: `project-004-agent-adapter-runtime / TK-032`

## Purpose

提供 Role Registry 基线能力，统一管理默认角色与自定义角色的注册、生命周期约束和解析审计记录。

## Baseline API

1. `RoleRegistry`
   - `listProfiles()`
   - `resolve(roleProfileId, context?)`
   - `resolveOrThrow(roleProfileId, context?)`
2. `createDefaultRoleProfiles()`
   - 返回默认角色画像快照（Planner/Architect/Coder/Tester/Reviewer/Verifier）。

## Notes

1. 生命周期字段覆盖 `aliases`、`supersedes`、`replacedBy`、`deprecatedAt`、`migrationNotes`。
2. 默认角色与自定义角色统一使用 `role_profile_id` 作为稳定主键。
3. 解析时支持别名与替代链路，结果会输出最小审计记录用于回链。
