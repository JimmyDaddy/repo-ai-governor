# Skills V1 Sprint 001 Checklist

- [ ] **TK-801** 定义官方 skill package layout 与 manifest（负责人：Platform｜优先级：P0｜截止：2026-03-19｜状态：todo）
  - 执行记录：plan=将 `skill-system-design` 中的目录建议收敛成正式 package layout、manifest 字段和版本边界，作为后续 CLI 安装与 adapter 接线的事实源;result=待执行;verify=待执行
- [ ] **TK-802** 实现 `skills install / list / doctor` 最小命令面（负责人：CLI｜优先级：P0｜截止：2026-03-20｜状态：todo）
  - 执行记录：plan=新增 skill 安装、发现和健康检查命令，确保用户安装本工具后能直接把官方 skills 安装到目标仓库;result=待执行;verify=待执行
- [ ] **TK-803** 落首批官方 skill 资产（负责人：Workflow｜优先级：P0｜截止：2026-03-21｜状态：todo）
  - 执行记录：plan=交付 `governor-context-loader`、`governor-plan-runner`、`governor-task-implementer`、`governor-delivery-finisher` 的正式资产和元数据;result=待执行;verify=待执行
- [ ] **TK-804** 完成首批 adapter skill 接线基线（负责人：Adapters｜优先级：P1｜截止：2026-03-22｜状态：todo）
  - 执行记录：plan=把同一套官方 skills 接到 `Codex / GitHub Copilot / Claude Code` 的安装入口或投影入口上，并提供可复现验收路径;result=待执行;verify=待执行
