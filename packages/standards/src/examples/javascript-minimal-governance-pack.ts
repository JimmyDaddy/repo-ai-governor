import {
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
} from '../constants/index.js';
import type { StandardsPack } from '../types/index.js';

/**
 * Provides one minimal reusable governance pack for JavaScript adopters.
 */
export const javascriptMinimalGovernancePack: StandardsPack = {
  packId: 'pack.official.javascript.minimal',
  packVersion: '1.0.0',
  packSource: StandardsPackSource.OFFICIAL,
  scope: StandardsPackScope.GLOBAL,
  mergePrecedence: 10,
  status: StandardsPackStatus.ACTIVE,
  rules: [
    {
      ruleId: 'rule.javascript.project.package-manifest',
      semanticKey: 'rule.javascript.project.package-manifest',
      severity: StandardsRuleSeverity.RECOMMENDED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            'JavaScript 项目应以 `package.json` 与一份 canonical lockfile 作为依赖、脚本与发布入口的唯一真值来源。',
          [StandardsRenderTarget.AI]:
            'Treat `package.json` plus one canonical lockfile as the source of truth for JavaScript dependencies, scripts, and release entrypoints.',
          [StandardsRenderTarget.AGENTS]:
            'Treat `package.json` plus one canonical lockfile as the JavaScript dependency and script source of truth.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Treat `package.json` plus one canonical lockfile as the source of truth for JavaScript dependencies, scripts, and release entrypoints.',
          [StandardsRenderTarget.AI]:
            'Treat `package.json` plus one canonical lockfile as the source of truth for JavaScript dependencies, scripts, and release entrypoints.',
          [StandardsRenderTarget.AGENTS]:
            'Treat `package.json` plus one canonical lockfile as the JavaScript dependency and script source of truth.',
        },
      },
    },
    {
      ruleId: 'rule.javascript.lint.project-script',
      semanticKey: 'rule.javascript.lint.project-script',
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            '交付前执行 `package.json` 中声明的 lint 或 formatter 脚本（例如 `pnpm run lint`），保持格式化与静态检查一致。',
          [StandardsRenderTarget.AI]:
            'Run the repository-declared lint or formatter script from `package.json` before delivery.',
          [StandardsRenderTarget.AGENTS]:
            'Require the repository-declared lint or formatter script from `package.json` before delivery.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Run the repository-declared lint or formatter script from `package.json` before delivery to keep formatting and static checks aligned.',
          [StandardsRenderTarget.AI]:
            'Run the repository-declared lint or formatter script from `package.json` before delivery.',
          [StandardsRenderTarget.AGENTS]:
            'Require the repository-declared lint or formatter script from `package.json` before delivery.',
        },
      },
    },
    {
      ruleId: 'rule.javascript.test.project-script',
      semanticKey: 'rule.javascript.test.project-script',
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            '最小回归测试基线应执行仓库声明的测试脚本（例如 `pnpm test`）；修改行为时需补齐对应测试。',
          [StandardsRenderTarget.AI]:
            'Run the repository-declared JavaScript test script and add coverage for changed behavior.',
          [StandardsRenderTarget.AGENTS]:
            'Require the repository-declared JavaScript test script and backfill coverage for changed behavior.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Run the repository-declared JavaScript test script as the minimal regression baseline and add coverage for changed behavior.',
          [StandardsRenderTarget.AI]:
            'Run the repository-declared JavaScript test script and add coverage for changed behavior.',
          [StandardsRenderTarget.AGENTS]:
            'Require the repository-declared JavaScript test script and backfill coverage for changed behavior.',
        },
      },
    },
    {
      ruleId: 'rule.javascript.runtime.build-or-typecheck',
      semanticKey: 'rule.javascript.runtime.build-or-typecheck',
      severity: StandardsRuleSeverity.RECOMMENDED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            '若仓库声明了 `build` 或 `typecheck` 脚本，推荐在交付前执行，用于收敛打包或 typed runtime 回归。',
          [StandardsRenderTarget.AI]:
            'Prefer the repository-declared `build` or `typecheck` script before delivery when packaging or typed runtime behavior changed.',
          [StandardsRenderTarget.AGENTS]:
            'Prefer the repository-declared `build` or `typecheck` script before delivery when packaging or typed runtime behavior changed.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Prefer the repository-declared `build` or `typecheck` script before delivery when packaging or typed runtime behavior changed.',
          [StandardsRenderTarget.AI]:
            'Prefer the repository-declared `build` or `typecheck` script before delivery when packaging or typed runtime behavior changed.',
          [StandardsRenderTarget.AGENTS]:
            'Prefer the repository-declared `build` or `typecheck` script before delivery when packaging or typed runtime behavior changed.',
        },
      },
    },
  ],
};
