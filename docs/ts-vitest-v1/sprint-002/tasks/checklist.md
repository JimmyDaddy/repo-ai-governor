# TS Vitest V1 Sprint 002 Checklist

- [x] **TK-2001** 清理试点模块临时类型豁免并收敛强类型（负责人：Core｜优先级：P0｜截止：2026-03-29｜状态：done）
  - 执行记录：plan=移除试点模块中的临时 `@ts-nocheck` 与弱类型占位，补充必要类型定义并保证行为不变;result=待执行;verify=待执行
  - 执行记录：plan=先收敛试点源码模块类型，移除 `validator/reporting` 的 `@ts-nocheck` 并补充显式类型定义;result=已完成 `src/config/schema/validator.ts`、`src/reporting/{report-model,report-source}.ts` 的类型化改造并移除 `@ts-nocheck`，当前 `typecheck` 与相关回归通过;verify=`npm run typecheck && npm run test -- test/config/schema.test.ts test/reporting/report-model.test.ts test/commands/report-command.test.js && npm run check`
  - 执行记录：review_delta=已完成 `TK-2001` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-2001-cleanup-pilot-ts-nocheck.md`;verify=`rg -n "@ts-nocheck" src/config/schema src/reporting || true`

- [x] **TK-2002** 迁移 `workflow/slots/standards/config` 到 TypeScript（负责人：Core｜优先级：P0｜截止：2026-03-30｜状态：done）
  - 执行记录：plan=将核心引擎与配置读取链路迁移为 TS，保留 ESM 导入兼容并通过构建与回归;result=待执行;verify=待执行
  - 执行记录：plan=分批迁移 workflow/slots/standards/config 到 `.ts` 并清理同路径 `.js`；优先保证 typecheck 与核心链路测试稳定;result=已完成 `src/workflow/*`、`src/slots/*`、`src/standards/*`、`src/config/{errors,repository-layout,load-config}` 的 TypeScript 迁移并删除旧 `.js`，核心域类型与执行模型已补齐;verify=`npm run typecheck && npm run test -- test/workflow/template-model.test.js test/workflow/governance-engine.test.js test/slots/slot-model.test.js test/slots/runtime.test.js test/standards/package-model.test.js test/standards/official-base-package.test.js test/config/repository-layout.test.js test/config/load-config.test.js && npm run check`
  - 执行记录：review_delta=已完成 `TK-2002` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-2002-migrate-core-workflow-slots-standards-config-to-ts.md`;verify=`rg --files src/workflow src/slots src/standards src/config | sort`

- [ ] **TK-2003** 迁移 `adapters/skills` 与 examples 脚本到 TypeScript（负责人：Core｜优先级：P1｜截止：2026-03-31｜状态：todo）
  - 执行记录：plan=迁移 adapter/skills 模块及示例渲染脚本，确保多适配器输出一致;result=待执行;verify=待执行

- [ ] **TK-2004** 迁移 `cli/runtime/commands` 到 TypeScript（负责人：Core｜优先级：P0｜截止：2026-04-01｜状态：todo）
  - 执行记录：plan=迁移 CLI 主链路并补齐命令上下文与错误模型类型，保持现有命令协议稳定;result=待执行;verify=待执行

- [ ] **TK-2005** 迁移测试层到 `.test.ts` 并保持 Vitest 稳定（负责人：QA｜优先级：P1｜截止：2026-04-02｜状态：todo）
  - 执行记录：plan=分批把剩余 `.test.js` 迁移到 `.test.ts`，优先覆盖核心命令与发布链路;result=待执行;verify=待执行

- [ ] **TK-2006** 增加 TS-only 审计门禁并收口发布约束（负责人：Release｜优先级：P0｜截止：2026-04-03｜状态：todo）
  - 执行记录：plan=新增 JS 残留白名单审计与 gate 集成，确保新增改造默认 TS 并持续通过发布门禁;result=待执行;verify=待执行
