# @repo-ai-governor/shared

- Status: baseline
- Date: 2026-03-19
- Scope: `project-001-foundation / TK-006`

## Purpose

统一承接跨模块复用能力；当前阶段优先落地 `i18next` runtime 基线，供 CLI/Runtime/Reporting 共享。

## Baseline API

1. `I18nRuntime`
   - `initialize(config, requestedLocale?)`
   - `resolveLocale(requestedLocale, supportedLocales, defaultLocale, fallbackLocale)`
   - `t(key, interpolation?)`
   - `formatMessage(key, interpolation?)`

## Notes

1. 当前资源内置 `zh-CN` 与 `en-US`。
2. locale 解析遵循 `requested -> language fallback -> default -> fallback`。
