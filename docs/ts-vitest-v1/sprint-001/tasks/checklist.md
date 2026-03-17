# TS Vitest V1 Sprint 001 Checklist

- [x] **TK-1001** 建立 TypeScript 工程与构建基线（负责人：Core｜优先级：P0｜截止：2026-03-22｜状态：done）
  - 执行记录：plan=新增 TypeScript 分层配置与构建脚本，打通 `src/bin -> dist` 执行链路并保持现有 CLI 行为稳定;result=已新增 `tsconfig.json`、`tsconfig.build.json`、`tsconfig.test.json`，安装 `typescript/@types-node`，新增 `typecheck/build/start:dist` 脚本，并通过 `scripts/build/copy-runtime-assets.js` 在 build 后复制 schema/skills/package 运行时资产;verify=`npm run typecheck && npm run build && npm run start:dist -- --help && npm run check`
  - 执行记录：review_delta=已完成 `TK-1001` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-1001-establish-typescript-baseline.md`;verify=`npx biome format --write package.json tsconfig.json tsconfig.build.json tsconfig.test.json scripts/build/copy-runtime-assets.js`

- [x] **TK-1002** 接入 Vitest 并迁移测试运行基线（负责人：QA｜优先级：P0｜截止：2026-03-23｜状态：done）
  - 执行记录：plan=引入 Vitest 与覆盖率能力，完成测试运行入口切换并迁移 `node:test` 导入基线;result=已新增 `vitest.config.ts`，安装 `vitest/@vitest/coverage-v8`，将 `npm test` 切换为 `vitest run`，新增 `test:watch/test:coverage` 脚本，并批量将 `test/**/*.test.js` 中 `import test from \"node:test\"` 迁移为 `import { test } from \"vitest\"`;verify=`npm test && npm run test:coverage`
  - 执行记录：plan=修复迁移后门禁兼容问题，保证 `npm run check` 可继续作为交付 gate;result=已更新 `code_standards.md` 验证命令参数为 `--maxWorkers=1 --maxConcurrency=1`，避免 Vitest 不识别 `--test-concurrency`;verify=`npm run check`
  - 执行记录：review_delta=已完成 `TK-1002` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-1002-adopt-vitest-test-baseline.md`;verify=`npm run typecheck && npm run build`

- [x] **TK-1003** 迁移基础模块与对应单测（试点批次）（负责人：Core｜优先级：P1｜截止：2026-03-25｜状态：done）
  - 执行记录：plan=试点迁移 `utils/config/schema/reporting` 到 TypeScript，并同步迁移对应单测到 `.test.ts`，验证导入与构建兼容策略;result=已新增 `src/utils/common.ts`、`src/config/schema/{index,validator}.ts`、`src/reporting/{report-model,report-source}.ts`，并将 `test/utils/common.test.ts`、`test/config/schema.test.ts`、`test/reporting/report-model.test.ts` 迁移到 TS；当前采用过渡双轨（保留运行时 `.js` 文件）避免 `src` 直跑链路回归;verify=`npm run typecheck && npm test && npm run check`
  - 执行记录：review_delta=已完成 `TK-1003` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-1003-pilot-typescript-module-migration.md`;verify=`npx biome format --write src/utils/common.ts src/config/schema/index.ts src/config/schema/validator.ts src/reporting/report-model.ts src/reporting/report-source.ts test/utils/common.test.ts test/config/schema.test.ts test/reporting/report-model.test.ts`

- [x] **TK-1004** 对齐 CI/Gate 与发布入口的 TS/Vitest 约束（负责人：Release｜优先级：P1｜截止：2026-03-26｜状态：done）
  - 执行记录：plan=对齐 CI 与发布门禁，统一 `typecheck + test + check` 路径，并将发布验收入口从源码直跑切换为 `dist` 入口校验;result=已新增 `ci:quality` 并更新 `quality-gate.yml`，`check` 改为 `build + check:code-standards`，`code_standards.md` CLI 校验改为 `node ./dist/bin/repo-ai-governor.js --help`，同时将 `package.json#bin` 指向 `./dist/bin/repo-ai-governor.js`，并在 `release` 脚本中新增 `dist` 入口断言与打包前构建;verify=`npm run test -- test/ci/quality-gate-workflow.test.js test/release/release-distribution.test.js test/release/release-automation.test.js && npm run check && npm run release:ga-check`
  - 执行记录：review_delta=已完成 `TK-1004` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-1004-align-ci-gate-release-entrypoint.md`;verify=`npm run release:check && npm run release:verify-local`

- [x] **TK-1005** 接入 Biome formatter 与格式化命令基线（负责人：Core｜优先级：P0｜截止：2026-03-20｜状态：done）
  - 执行记录：plan=引入 Biome 作为统一 formatter，新增仓库级配置和标准命令;result=已新增 `biome.json`、安装 `@biomejs/biome`、新增 `npm run format` 与 `npm run format:check` 脚本，并将 Biome 设为 formatter-only（linter disabled）;verify=`npx biome format biome.json package.json`
  - 执行记录：review_delta=已完成 `TK-1005` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-1005-adopt-biome-formatter-baseline.md`;verify=`npm run format:check` 当前因历史文件未统一格式化而失败，预期在后续批次收敛

- [x] **TK-1006** 参考 `camera_point` 启用 Biome linter 规则与 lint 命令（负责人：Core｜优先级：P0｜截止：2026-03-20｜状态：done）
  - 执行记录：plan=参考 `/Users/jimmydaddy/study/camera_point/biome.json` 对齐 Biome 规则，启用 `organizeImports` 与 `linter.rules`，并新增 lint 脚本;result=已将 `@biomejs/biome` 版本对齐到 `^1.9.4`，更新当前仓库 `biome.json` 为参考配置模型，并在 `package.json` 新增 `npm run lint`;verify=`npx biome --version && npx biome check biome.json package.json`
  - 执行记录：review_delta=已完成 `TK-1006` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-1006-enable-biome-linter-camera-point-reference.md`;verify=`npm run lint -- --max-diagnostics=20` 可执行，当前因历史代码未完全收敛而存在诊断

- [x] **TK-1007** 清理试点双轨 JS 残留并收敛 TS-only 入口（负责人：Core｜优先级：P1｜截止：2026-03-28｜状态：done）
  - 执行记录：plan=创建 JS 残留收敛任务并先完成双轨清单盘点，确定迁移顺序与入口切换前置条件;result=已识别当前 `src` 双轨文件共 5 组：`src/utils/common`、`src/config/schema/index`、`src/config/schema/validator`、`src/reporting/report-model`、`src/reporting/report-source`，下一步将先收敛本地运行入口后再移除冗余 `.js`;verify=`for f in $(find src -name '*.ts' | sort); do b=\"${f%.ts}\"; [ -f \"$b.js\" ] && echo \"$b\"; done`
  - 执行记录：plan=先执行入口收敛第一步，降低后续删除双轨 `.js` 的回归风险;result=已将 `bin/repo-ai-governor.js` 调整为 dist-first，并在仓库源代码场景中补充“dist 缺失自动 build”能力；同时将 `scripts/examples/render-*.js` 切换为加载 `dist/src/adapters/*`;verify=`npm run test -- test/ci/ci-scripts.test.js test/adapters/codex-bundle.test.js test/adapters/claude-code-bundle.test.js test/adapters/github-copilot-bundle.test.js && npm run check`
  - 执行记录：plan=删除试点双轨冗余 `.js` 文件并验证端到端发布链路;result=已删除 `src/utils/common.js`、`src/config/schema/{index,validator}.js`、`src/reporting/{report-model,report-source}.js`，当前试点目录双轨清单复查为空;verify=`for f in $(find src -name '*.ts' | sort); do b=\"${f%.ts}\"; [ -f \"$b.js\" ] && echo \"$b\"; done && npm run release:ga-check`
  - 执行记录：review_delta=已完成 `TK-1007` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-1007-converge-pilot-dual-track-js-leftovers.md`;verify=`npm run test -- test/release/release-distribution.test.js test/release/getting-started-acceptance.test.js`
