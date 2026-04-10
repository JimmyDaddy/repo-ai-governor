# checklist

- [x] TK-741 activate project-077 and freeze review-promotion-decomposition scope
  - 2026-04-10：任务创建，状态初始化为 `in_progress`。
  - 2026-04-10：已创建 `project-077 / sprint-001` 目录骨架、初始 project/sprint plan、治理任务卡与 review 目录。
  - 2026-04-10：已将 `project-077 / sprint-001` 登记到 `current-context.md` 的并行 active streams，并明确不改写 `project-076` 的 primary / CR surface。
- [x] TK-742 review session-main prompt-first command-model solution to approval readiness
  - 2026-04-10：任务创建，状态初始化为 `planned`。
  - 2026-04-10：已启动 fresh reviewer sub-agent，开始构建 canonical technical-solution review baseline，并准备在同一路径沉淀 review artifact。
  - 2026-04-10：两次 fresh reviewer sub-agent 尝试均被本地服务异常阻断，其中一轮明确返回 `503 Service Unavailable`；同窗改由主 agent 按同一 baseline 完成 fallback review。
  - 2026-04-10：draft 已补齐 capability interaction mapping、formal landing、`run` narrowed conclusion 与 `/verify` removal seam boundary，canonical review artifact 已给出 `approved` 结论并同步 lifecycle。
- [x] TK-743 promote solution and decompose rollout into project-077 implementation sprints
  - 2026-04-10：任务创建，状态初始化为 `planned`。
  - 2026-04-10：完成 `runtime.orchestration` command-model ADR + capability interaction model contract，以及 `runtime.cli-interactive-shell` consumer-facing formal amendments。
  - 2026-04-10：lifecycle 已将 solution 推进为 `active` 并写入 `final_paths`；delivery registry 已固定为 `followup_required` 指向 `project-077 / sprint-002`。
  - 2026-04-10：完成 `project-077 / sprint-002 ~ sprint-005` decomposition、`DA-719` handoff artifact、artifact registry write-back 与 `current-context.md` primary stream 切换。
  - 2026-04-10：完成 promotion cutover、solution activation、DA-719 handoff、project-077 sprint-002~005 decomposition 与 primary stream 切换。
