# TK-301 正式支持矩阵文档与 clean-room smoke 记录

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-004-ga-evidence-and-support-matrix`

## 1. 任务目标

发布正式支持矩阵文档，声明当前正式支持的安装模式、适配器、IDE surface、语言治理模板和运行时基线，并附 clean-room smoke 记录。

## 2. Depends On

1. `TK-300`（sprint-003 出口验收已通过）

## 3. 预期产物

1. `docs/support-matrix.md` — 正式支持矩阵（英文）
2. `docs/support-matrix.zh-CN.md` — 正式支持矩阵（中文）
3. clean-room smoke 记录（嵌入文档或独立 evidence 文件）

## 4. 支持矩阵覆盖范围

### 4.1 安装模式

| 模式 | 支持状态 | 说明 |
|------|---------|------|
| `pnpm link` | Supported | 开发/试点首选 |
| `path` (file: protocol) | Supported | 本地仓库引用 |
| `dist` binary | Supported | 免安装分发路径 |
| `tgz` registry | Supported | 需 private registry |

### 4.2 适配器

| 适配器 | 支持状态 | 说明 |
|--------|---------|------|
| codex | Fixture-backed | 规则渲染 + AGENTS.md 投影可用 |
| github-copilot | Fixture-backed | 规则渲染 + AGENTS.md 投影可用 |
| claude-code | Fixture-backed | 规则渲染 + AGENTS.md 投影可用 |

### 4.3 语言治理模板

| 语言 | 支持状态 | 说明 |
|------|---------|------|
| TypeScript | Built-in | 内置完整治理链 |
| Python | Minimal baseline | `pythonMinimalGovernancePack` |
| Go | Minimal baseline | `goMinimalGovernancePack` |

### 4.4 运行时基线

| 项目 | 要求 |
|------|------|
| Node.js | >= 22.x |
| pnpm | >= 9.x |
| OS | macOS / Linux / WSL2 |

### 4.5 IDE Surface

| Surface | 支持状态 | 说明 |
|---------|---------|------|
| CLI | Supported | 主要入口 |
| Desktop Client | Planned | 架构就绪，待实装 |

## 5. Clean-room Smoke 验证项

1. 在干净环境下执行 `doctor --output pretty` 确认 health 通过
2. 在干净环境下执行 `verify --output pretty` 确认适配器 fixture-backed 通过
3. 在干净环境下执行 `workspace dry-run` 确认 workspace 规划可用
4. 利用 `scripts/release/verify-local-distribution.js` 执行分发路径验证
5. 利用 `scripts/examples/check-desktop-entry-smoke.js` 执行 desktop entry smoke
6. 记录每次执行的通过/失败状态与时间戳

## 6. 输入约束（来自 TK-300）

1. 不得绕过 `StandardsPackRegistry` 另起平行 contract。
2. 术语与 playbook 口径必须沿用 sprint-003 定型的 pretty output 语义。
3. 保持 `test/public-package-exports.integration.test.ts`、`test/i18n-translation-key-coverage.integration.test.ts`、`apps/cli/test/cli-output-contract.integration.test.ts` 绿灯。

## 7. 验证命令

1. `pnpm run typecheck`
2. `pnpm vitest run --config vitest.integration.config.ts test/public-package-exports.integration.test.ts`
3. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
