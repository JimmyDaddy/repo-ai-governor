import {
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
} from '../constants/index.js';
import type { StandardsPack } from '../types/index.js';

/**
 * Provides one minimal reusable governance pack for Go adopters.
 */
export const goMinimalGovernancePack: StandardsPack = {
  packId: 'pack.official.go.minimal',
  packVersion: '1.0.0',
  packSource: StandardsPackSource.OFFICIAL,
  scope: StandardsPackScope.GLOBAL,
  mergePrecedence: 10,
  status: StandardsPackStatus.ACTIVE,
  rules: [
    {
      ruleId: 'rule.go.project.modules',
      semanticKey: 'rule.go.project.modules',
      severity: StandardsRuleSeverity.RECOMMENDED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            'Go 项目应以 `go.mod` / `go.sum` 作为依赖与模块边界的唯一真值来源。',
          [StandardsRenderTarget.AI]:
            'Treat `go.mod` and `go.sum` as the canonical source for Go dependency and module boundaries.',
          [StandardsRenderTarget.AGENTS]:
            'Treat `go.mod` and `go.sum` as the canonical Go dependency source.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Treat `go.mod` and `go.sum` as the canonical source for Go dependencies and module boundaries.',
          [StandardsRenderTarget.AI]:
            'Treat `go.mod` and `go.sum` as the canonical source for Go dependency and module boundaries.',
          [StandardsRenderTarget.AGENTS]:
            'Treat `go.mod` and `go.sum` as the canonical Go dependency source.',
        },
      },
    },
    {
      ruleId: 'rule.go.format.go-fmt',
      semanticKey: 'rule.go.format.go-fmt',
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]: '交付前执行 `go fmt ./...`，保持格式与 import 排列一致。',
          [StandardsRenderTarget.AI]: 'Run `go fmt ./...` before delivery.',
          [StandardsRenderTarget.AGENTS]: 'Require `go fmt ./...` before delivery.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Run `go fmt ./...` before delivery to keep formatting and imports aligned.',
          [StandardsRenderTarget.AI]: 'Run `go fmt ./...` before delivery.',
          [StandardsRenderTarget.AGENTS]: 'Require `go fmt ./...` before delivery.',
        },
      },
    },
    {
      ruleId: 'rule.go.test.go-test',
      semanticKey: 'rule.go.test.go-test',
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            '最小回归测试基线执行 `go test ./...`；修改行为时需补齐测试。',
          [StandardsRenderTarget.AI]: 'Run `go test ./...` and add coverage for changed behavior.',
          [StandardsRenderTarget.AGENTS]:
            'Require `go test ./...` and add coverage for changed behavior.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Run `go test ./...` as the minimal regression baseline and add coverage for changed behavior.',
          [StandardsRenderTarget.AI]: 'Run `go test ./...` and add coverage for changed behavior.',
          [StandardsRenderTarget.AGENTS]:
            'Require `go test ./...` and add coverage for changed behavior.',
        },
      },
    },
    {
      ruleId: 'rule.go.vet.go-vet',
      semanticKey: 'rule.go.vet.go-vet',
      severity: StandardsRuleSeverity.RECOMMENDED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]: '推荐在交付前执行 `go vet ./...`，尽早收敛常见静态问题。',
          [StandardsRenderTarget.AI]:
            'Prefer `go vet ./...` before delivery to catch common static issues.',
          [StandardsRenderTarget.AGENTS]: 'Prefer `go vet ./...` before delivery.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Prefer `go vet ./...` before delivery to catch common static issues.',
          [StandardsRenderTarget.AI]:
            'Prefer `go vet ./...` before delivery to catch common static issues.',
          [StandardsRenderTarget.AGENTS]: 'Prefer `go vet ./...` before delivery.',
        },
      },
    },
  ],
};
