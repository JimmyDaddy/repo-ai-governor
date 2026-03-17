# TS Vitest V1 Sprint 001 Checklist

- [ ] **TK-1001** 建立 TypeScript 工程与构建基线（负责人：Core｜优先级：P0｜截止：2026-03-22｜状态：todo）
  - 执行记录：plan=新增 tsconfig 分层配置与 typecheck/build scripts，建立 `src -> dist` 可运行链路;result=待执行;verify=待执行

- [ ] **TK-1002** 接入 Vitest 并迁移测试运行基线（负责人：QA｜优先级：P0｜截止：2026-03-23｜状态：todo）
  - 执行记录：plan=引入 vitest 与 coverage 配置，切换 `npm test` 到 `vitest run` 并迁移测试入口;result=待执行;verify=待执行

- [ ] **TK-1003** 迁移基础模块与对应单测（试点批次）（负责人：Core｜优先级：P1｜截止：2026-03-25｜状态：todo）
  - 执行记录：plan=优先迁移 `utils/config/schema/reporting` 等低风险模块与相关测试，验证迁移模式可复制;result=待执行;verify=待执行

- [ ] **TK-1004** 对齐 CI/Gate 与发布入口的 TS/Vitest 约束（负责人：Release｜优先级：P1｜截止：2026-03-26｜状态：todo）
  - 执行记录：plan=更新 CI/test/check 流程与发布入口，确保不依赖源码 JS 即可完成构建、测试与打包验收;result=待执行;verify=待执行

- [x] **TK-1005** 接入 Biome formatter 与格式化命令基线（负责人：Core｜优先级：P0｜截止：2026-03-20｜状态：done）
  - 执行记录：plan=引入 Biome 作为统一 formatter，新增仓库级配置和标准命令;result=已新增 `biome.json`、安装 `@biomejs/biome`、新增 `npm run format` 与 `npm run format:check` 脚本，并将 Biome 设为 formatter-only（linter disabled）;verify=`npx biome format biome.json package.json`
  - 执行记录：review_delta=已完成 `TK-1005` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-1005-adopt-biome-formatter-baseline.md`;verify=`npm run format:check` 当前因历史文件未统一格式化而失败，预期在后续批次收敛

- [x] **TK-1006** 参考 `camera_point` 启用 Biome linter 规则与 lint 命令（负责人：Core｜优先级：P0｜截止：2026-03-20｜状态：done）
  - 执行记录：plan=参考 `/Users/jimmydaddy/study/camera_point/biome.json` 对齐 Biome 规则，启用 `organizeImports` 与 `linter.rules`，并新增 lint 脚本;result=已将 `@biomejs/biome` 版本对齐到 `^1.9.4`，更新当前仓库 `biome.json` 为参考配置模型，并在 `package.json` 新增 `npm run lint`;verify=`npx biome --version && npx biome check biome.json package.json`
  - 执行记录：review_delta=已完成 `TK-1006` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-1006-enable-biome-linter-camera-point-reference.md`;verify=`npm run lint -- --max-diagnostics=20` 可执行，当前因历史代码未完全收敛而存在诊断
