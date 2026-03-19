# TK-006 Shared i18n Runtime Baseline

- Status: active
- Date: 2026-03-19
- Type: baseline/contract
- Producer Task: `TK-006`

## 1. Scope

1. 在 `packages/shared/src/i18n` 固化 `i18next` runtime 基线，避免各模块重复实现 locale 策略。
2. 以 `zh-CN/en-US` 为第一阶段资源基线，支持 CLI 先落地后扩展。

## 2. Runtime API Surface

1. `initialize(config, requestedLocale?)`
   - 初始化 i18n 资源并返回实际生效 locale。
2. `resolveLocale(requestedLocale, supportedLocales, defaultLocale, fallbackLocale)`
   - 统一 locale 解析优先级与语言级回退逻辑。
3. `t(key, interpolation?)`
   - 输出本地化文案。
4. `formatMessage(key, interpolation?)`
   - 语义等价于 `t`，供调用方使用更明确的命名。

## 3. Locale Resolution Policy

1. 解析顺序：`requested` -> `requested language` -> `default` -> `default language` -> `fallback`。
2. 候选 locale 不在 `supportedLocales` 时，优先匹配同语言 locale（例如 `zh-TW -> zh-CN`）。
3. 所有候选均失效时，降级为 `supportedLocales[0]`，最后兜底 `fallbackLocale`。

## 4. Output Stability Constraints

1. 关闭 i18next support notice 输出，避免 CLI 标准输出被第三方提示污染。
2. 本地化仅影响人类可读文案，机器可读字段保持稳定。
