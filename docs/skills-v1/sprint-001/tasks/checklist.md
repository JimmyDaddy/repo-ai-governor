# Skills V1 Sprint 001 Checklist

- [x] **TK-801** 定义官方 skill package layout 与 manifest（负责人：Platform｜优先级：P0｜截止：2026-03-19｜状态：done）
  - 执行记录：plan=将 `skill-system-design` 中的目录建议收敛成正式 package layout、manifest 字段和版本边界，作为后续 CLI 安装与 adapter 接线的事实源;result=已新增 `src/skills/package-layout.js`、`skill-manifest.schema.json`、`skill-catalog.schema.json`、`skills/official/catalog.json` 和 `skills/shared/README.md`，并让 npm 分发清单包含 `skills/`;verify=`PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/skills/package-layout.test.js && PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/config/schema.test.js`
  - 执行记录：review_delta=已完成 `TK-801` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-801-define-skill-package-layout.md`;verify=复核确认官方 skill 目录、manifest schema、catalog 入口和 install target 约定已对齐 `Codex / GitHub Copilot / Claude Code`
- [x] **TK-802** 实现 `skills install / list / doctor` 最小命令面（负责人：CLI｜优先级：P0｜截止：2026-03-20｜状态：done）
  - 执行记录：plan=新增 skill 安装、发现和健康检查命令，确保用户安装本工具后能直接把官方 skills 安装到目标仓库;result=已新增 `src/commands/skills-command.js`、`src/skills/catalog.js`、`src/skills/runtime.js`、`src/skills/semver.js` 和 `test/commands/skills-command.test.js`，命令面支持 `skills install/list/doctor`、`--catalog`、`--surface`、`--scope`、`--strict`;verify=`PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/commands/skills-command.test.js && PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node ./bin/repo-ai-governor.js skills list --format json && PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node ./bin/repo-ai-governor.js skills doctor --surface codex --format json`
  - 执行记录：review_delta=已完成 `TK-802` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-802-implement-skills-command.md`;verify=复核确认 `skills` 命令可识别外部 skill、不误判本仓库现有 `.codex/skills/workspace-delivery-finisher`，并具备可复用的 catalog/install/doctor 基线
- [ ] **TK-803** 落首批官方 skill 资产（负责人：Workflow｜优先级：P0｜截止：2026-03-21｜状态：todo）
  - 执行记录：plan=交付 `governor-context-loader`、`governor-plan-runner`、`governor-task-implementer`、`governor-delivery-finisher` 的正式资产和元数据;result=待执行;verify=待执行
- [ ] **TK-804** 完成首批 adapter skill 接线基线（负责人：Adapters｜优先级：P1｜截止：2026-03-22｜状态：todo）
  - 执行记录：plan=把同一套官方 skills 接到 `Codex / GitHub Copilot / Claude Code` 的安装入口或投影入口上，并提供可复现验收路径;result=待执行;verify=待执行
