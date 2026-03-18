# Verified Review - TK-1007 Converge Pilot Dual-Track JS Leftovers

- Status: verified
- Date: 2026-03-17
- Task: `TK-1007`
- Scope:
  - `bin/repo-ai-governor.js`
  - `scripts/examples/load-dist-module.js`
  - `scripts/examples/render-codex-adapter-bundle.js`
  - `scripts/examples/render-claude-code-adapter-bundle.js`
  - `scripts/examples/render-github-copilot-adapter-bundle.js`
  - `src/utils/common.js` (deleted)
  - `src/config/schema/index.js` (deleted)
  - `src/config/schema/validator.js` (deleted)
  - `src/reporting/report-model.js` (deleted)
  - `src/reporting/report-source.js` (deleted)

## Review Summary

1. 已完成试点双轨冗余 `.js` 清理，`utils/config/schema/reporting` 目录不再存在同路径 `.js/.ts` 并存。
2. CLI 启动链路收敛为 dist-first：优先加载构建产物，仓库源码场景下 dist 缺失会自动触发 build。
3. examples 渲染脚本已改为加载 `dist/src/adapters/*`，避免继续依赖源码 `src` 直跑。

## Findings

1. 无阻塞问题。

## Verification

1. `for f in $(find src -name '*.ts' | sort); do b=\"${f%.ts}\"; [ -f \"$b.js\" ] && echo \"$b\"; done` -> 空输出
2. `npm run test -- test/ci/ci-scripts.test.js test/adapters/codex-bundle.test.js test/adapters/claude-code-bundle.test.js test/adapters/github-copilot-bundle.test.js` -> pass（4 files / 11 tests）
3. `npm run test -- test/release/release-distribution.test.js test/release/getting-started-acceptance.test.js` -> pass（2 files / 3 tests）
4. `npm run check` -> pass
5. `npm run release:ga-check` -> pass

## Conclusion

`TK-1007` 通过复核，试点双轨 `.js` 冗余已完成首批收敛，并保持 CI 与发布门禁稳定。
