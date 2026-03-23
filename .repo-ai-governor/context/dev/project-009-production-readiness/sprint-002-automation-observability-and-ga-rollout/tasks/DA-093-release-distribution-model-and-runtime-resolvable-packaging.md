# DA-093 发布分发模型与运行时可解析打包收敛产物

- Status: active
- Date: 2026-03-23
- Owner: AI-Agent
- Source Task: `TK-081`
- Version: `v1`

## 1. 目标

在不发布到 npm 的前提下，确保本工具在 clean-room 场景可通过 `tgz` 安装并在运行时可解析全部必需依赖，消除对未发布 workspace 包路径的隐式依赖。

## 2. 关键决策

1. 保留 pnpm workspace `apps/ + packages/` 开发模型，同时在构建阶段将运行时所需内部包快照复制到 `dist/node_modules/@repo-ai-governor/*`。
2. 放弃 dist 内部软链接到工作区源目录的策略，避免 clean-room/tgz 环境出现路径失效。
3. 将 `commander`、`i18next`、`yaml` 作为根运行时依赖显式声明，保证 CLI 产物在安装后可直接执行。
4. 将 clean-room tgz 验证纳入发布候选链路，确保候选包在 `--help -> init -> doctor -> check` 链路可复跑。

## 3. 实施内容

1. 更新 `scripts/build/copy-runtime-assets.js`：
   - 统一内部包分发表；
   - 构建后复制 package snapshot 到 `dist/node_modules/@repo-ai-governor/<pkg>`；
   - 取消原先 symlink 策略。
2. 更新 `package.json`：
   - 新增根依赖：`commander`、`i18next`、`yaml`；
   - 新增脚本：`release:verify-cleanroom-local-install:tgz`；
   - 更新 `release:candidate` 以串联 clean-room 本地与 tgz 验证。
3. 更新 `scripts/release/verify-local-distribution.js`：
   - 增加 dist 内部 package snapshot 的必需文件检查。
4. 更新 `scripts/release/check-release-ready.js`：
   - 将 clean-room 两条验证脚本加入发布前必需脚本集合。
5. 更新本地采用文档：
   - `docs/local-adoption-playbook.md`
   - `docs/local-adoption-playbook.zh-CN.md`
   - 将 tgz 从“已知限制”改为“已纳入 Stage 9B+ 基线验证”。

## 4. 验证证据

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `pnpm run check`（通过）
4. `pnpm run release:check`（通过）
5. `pnpm run release:verify-local`（通过）
6. `pnpm run release:verify-cleanroom-local-install --modes tgz --iterations 1`（通过）

## 5. 消费约束

1. `TK-082/TK-084/TK-085/TK-086` 默认以本产物为发布可执行性与 clean-room 验证基线，不得回退到依赖工作区软链接的运行时模型。
2. 后续若新增运行时第三方依赖，必须同步更新根依赖声明与 `release:verify-local` 检查项。
