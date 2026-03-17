# TS Vitest V1 Sprint 002 Checklist

- [ ] **TK-2001** 清理试点模块临时类型豁免并收敛强类型（负责人：Core｜优先级：P0｜截止：2026-03-29｜状态：todo）
  - 执行记录：plan=移除试点模块中的临时 `@ts-nocheck` 与弱类型占位，补充必要类型定义并保证行为不变;result=待执行;verify=待执行

- [ ] **TK-2002** 迁移 `workflow/slots/standards/config` 到 TypeScript（负责人：Core｜优先级：P0｜截止：2026-03-30｜状态：todo）
  - 执行记录：plan=将核心引擎与配置读取链路迁移为 TS，保留 ESM 导入兼容并通过构建与回归;result=待执行;verify=待执行

- [ ] **TK-2003** 迁移 `adapters/skills` 与 examples 脚本到 TypeScript（负责人：Core｜优先级：P1｜截止：2026-03-31｜状态：todo）
  - 执行记录：plan=迁移 adapter/skills 模块及示例渲染脚本，确保多适配器输出一致;result=待执行;verify=待执行

- [ ] **TK-2004** 迁移 `cli/runtime/commands` 到 TypeScript（负责人：Core｜优先级：P0｜截止：2026-04-01｜状态：todo）
  - 执行记录：plan=迁移 CLI 主链路并补齐命令上下文与错误模型类型，保持现有命令协议稳定;result=待执行;verify=待执行

- [ ] **TK-2005** 迁移测试层到 `.test.ts` 并保持 Vitest 稳定（负责人：QA｜优先级：P1｜截止：2026-04-02｜状态：todo）
  - 执行记录：plan=分批把剩余 `.test.js` 迁移到 `.test.ts`，优先覆盖核心命令与发布链路;result=待执行;verify=待执行

- [ ] **TK-2006** 增加 TS-only 审计门禁并收口发布约束（负责人：Release｜优先级：P0｜截止：2026-04-03｜状态：todo）
  - 执行记录：plan=新增 JS 残留白名单审计与 gate 集成，确保新增改造默认 TS 并持续通过发布门禁;result=待执行;verify=待执行
