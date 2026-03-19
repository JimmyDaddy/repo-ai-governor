# TK-006 CLI Skeleton Baseline

- Status: active
- Date: 2026-03-19
- Type: baseline/contract
- Producer Task: `TK-006`

## 1. Scope

1. 提供 `repo-ai-governor` 在 Stage 1 的最小可执行命令骨架，不承诺真实治理逻辑。
2. 命令骨架输出必须通过 shared i18n runtime 渲染，保证 locale 可控且可回放。

## 2. Command Surface

1. `init`
2. `doctor`
3. `check`
4. `run`
5. `review`
6. `review-verify`
7. `plan`
8. `upgrade`

## 3. Global Options

1. `--locale <locale>`
   - 用于控制人类可读输出的 locale。
2. `--profile <profileId>`
   - 用于注入配置 profile（先解析配置，再执行命令骨架）。

## 4. Runtime Behavior Baseline

1. 命令骨架统一输出 `command/locale/profile/configSource` 四类执行上下文。
2. 缺失 `.repo-ai-governor/governor.yaml` 时，回退到内置 `zh-CN/en-US` i18n 配置基线。
3. CLI 入口由 `bin/repo-ai-governor.ts` 转发到 `apps/cli/src/main.ts`，保持入口与应用层解耦。
