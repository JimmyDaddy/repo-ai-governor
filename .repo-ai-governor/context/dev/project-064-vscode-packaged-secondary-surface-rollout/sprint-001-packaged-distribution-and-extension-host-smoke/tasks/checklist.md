# checklist

- [x] TK-670 freeze VS Code packaged distribution contract and smoke gate
  - 2026-04-08：任务创建，状态初始化为 `planned`。
  - 2026-04-08：`project-067` final closeout 完成后，本任务作为 `project-064` 起始边界被激活并切换为 `in_progress`。
  - 2026-04-08：已冻结正式 contract truth：VS Code secondary surface 的正式支持从“已构建 governor 源码仓”开始，可走 `apps/vscode-extension` 的 extension-development host，或从同一源码仓本地生成一份 VSIX / packaged extension root；已发布 npm/tgz 安装面与 Marketplace 分发继续排除在正式支持范围之外，trust-sensitive action 仍受 `Workspace Trust` 保护。
- [x] TK-671 implement VSIX build release path and extension-host smoke follow-up
  - 2026-04-08：任务创建，状态初始化为 `planned`。
  - 2026-04-08：已补齐 `release:pack-vscode-extension` / `release:verify-vscode-extension-distribution`、VS Code extension package metadata、`@repo-ai-governor/core-orchestration-service/sidecar-client` 子路径导出，以及 packaged root/VSIX 所需的 runtime asset copy 与 packaging boundary 测试面。
  - 2026-04-08：`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-064-vscode-extension-distribution-report.json` 已通过，生成了本地 VSIX、packaged extension root 与机器可读 report，正式把“本地生成 VSIX / packaged extension root”收敛为可复跑的支持边界。
- [x] TK-672 close VS Code packaged secondary-surface support declaration
  - 2026-04-08：任务创建，状态初始化为 `planned`。
  - 2026-04-08：已将 app README、根 README、local adoption playbook、maintainer validation playbook 与 support matrix 的中英文版本收敛到同一条 narrative：VS Code secondary surface 正式支持“已构建源码仓 + extension-development host”与“已构建源码仓本地生成 VSIX / packaged extension root”，但不扩大为已发布 npm/tgz 安装器或 Marketplace 声明。
  - 2026-04-08：`scripts/release/verify-local-distribution.js` 的 truthfulness 断言已同步更新，并完成 `pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`、`pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` 与 `node ./scripts/release/verify-local-distribution.js --output .tmp/project-064-local-distribution-report.json` 验证。
- [x] CR-001 sprint-001-packaged-distribution-and-extension-host-smoke delegated review loop round 1
  - 2026-04-08：任务创建，状态初始化为 `review_pending`。
  - 2026-04-08：fresh reviewer `Helmholtz` 返回 `No actionable findings.`；主 agent 复核 VS Code packaged boundary、release 脚本、docs/support narrative 与同窗口绿色验证证据后，确认无新增 blocker，任务切换为 `resolved`。
- [x] TK-704 sprint-001 exit acceptance and project-final review activation handoff
  - 2026-04-08：任务在 `TK-670`、`TK-671`、`TK-672` 与 `CR-001` 全部进入终态后创建。
  - 2026-04-08：已写入 `DA-704`、project/sprint closeout handoff 与 `current-context` note；当前 sprint surface 保留给后续 `project-064` project-final CR loop。
