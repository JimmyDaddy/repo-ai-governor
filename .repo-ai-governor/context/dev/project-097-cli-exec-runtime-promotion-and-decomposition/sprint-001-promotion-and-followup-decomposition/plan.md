# sprint-001-promotion-and-followup-decomposition 计划

- Status: completed
- Date: 2026-04-13
- Project: `project-097-cli-exec-runtime-promotion-and-decomposition`
- Sprint Goal: 完成 cli-exec runtime solution 的 formal promotion cutover，并将后续实现拆解为 `project-098` planned follow-up stream。

## 1. Task Package

1. `TK-817` activate project-097 and freeze cli-exec runtime promotion scope
2. `TK-818` promote cli-exec runtime solution into formal module docs and registries
3. `TK-819` decompose cli-exec runtime rollout into planned project-098 and activation handoff
4. `TK-820` finalize project-097 closeout and register planned rollout ownership

## 2. Exit Criteria

1. `technical-solution.cli-exec-runtime-hardening-and-explicit-acp-extension-seam` 已进入 `active` lifecycle，并写入 `final_paths`。
2. `runtime.agent-projection` formal docs 已同步 shared native `cli_exec` runtime、adapter-owned launch authoring 与 explicit ACP seam guardrail。
3. `project-098` planned rollout stream 已落地为真实 project / sprint / task surface。

## 3. Milestones

1. 2026-04-13：作为 `project-097` 的唯一 promotion / decomposition surface 创建，当前保持 `completed` 真值。
2. 2026-04-13：`TK-817 ~ TK-819` 已完成 formal docs、registry 和 planned rollout decomposition；下一边界进入 project-final closeout。
3. 2026-04-13：`TK-820` 完成 closeout write-back 后，当前 stream 将迁入 completed history，并把 `project-098 / sprint-001` 保留为 planned follow-up stream。
