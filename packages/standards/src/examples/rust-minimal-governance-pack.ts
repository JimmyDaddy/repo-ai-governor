import {
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
} from '../constants/index.js';
import type { StandardsPack } from '../types/index.js';

/**
 * Provides one minimal reusable governance pack for Rust adopters.
 */
export const rustMinimalGovernancePack: StandardsPack = {
  packId: 'pack.official.rust.minimal',
  packVersion: '1.0.0',
  packSource: StandardsPackSource.OFFICIAL,
  scope: StandardsPackScope.GLOBAL,
  mergePrecedence: 10,
  status: StandardsPackStatus.ACTIVE,
  rules: [
    {
      ruleId: 'rule.rust.project.cargo-manifest',
      semanticKey: 'rule.rust.project.cargo-manifest',
      severity: StandardsRuleSeverity.RECOMMENDED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            'Rust 项目应以 `Cargo.toml` 与 `Cargo.lock` 作为依赖与 workspace 边界的唯一真值来源。',
          [StandardsRenderTarget.AI]:
            'Treat `Cargo.toml` and `Cargo.lock` as the canonical source for Rust dependency and workspace boundaries.',
          [StandardsRenderTarget.AGENTS]:
            'Treat `Cargo.toml` and `Cargo.lock` as the canonical Rust dependency source.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Treat `Cargo.toml` and `Cargo.lock` as the canonical source for Rust dependencies and workspace boundaries.',
          [StandardsRenderTarget.AI]:
            'Treat `Cargo.toml` and `Cargo.lock` as the canonical source for Rust dependency and workspace boundaries.',
          [StandardsRenderTarget.AGENTS]:
            'Treat `Cargo.toml` and `Cargo.lock` as the canonical Rust dependency source.',
        },
      },
    },
    {
      ruleId: 'rule.rust.format.cargo-fmt',
      semanticKey: 'rule.rust.format.cargo-fmt',
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            '交付前执行 `cargo fmt --all --check`，保持格式与 import 排列一致。',
          [StandardsRenderTarget.AI]: 'Run `cargo fmt --all --check` before delivery.',
          [StandardsRenderTarget.AGENTS]: 'Require `cargo fmt --all --check` before delivery.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Run `cargo fmt --all --check` before delivery to keep formatting and imports aligned.',
          [StandardsRenderTarget.AI]: 'Run `cargo fmt --all --check` before delivery.',
          [StandardsRenderTarget.AGENTS]: 'Require `cargo fmt --all --check` before delivery.',
        },
      },
    },
    {
      ruleId: 'rule.rust.lint.cargo-clippy',
      semanticKey: 'rule.rust.lint.cargo-clippy',
      severity: StandardsRuleSeverity.RECOMMENDED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            '推荐在交付前执行 `cargo clippy --workspace --all-targets --all-features`，尽早收敛常见静态问题。',
          [StandardsRenderTarget.AI]:
            'Prefer `cargo clippy --workspace --all-targets --all-features` before delivery to catch common static issues.',
          [StandardsRenderTarget.AGENTS]:
            'Prefer `cargo clippy --workspace --all-targets --all-features` before delivery.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Prefer `cargo clippy --workspace --all-targets --all-features` before delivery to catch common static issues.',
          [StandardsRenderTarget.AI]:
            'Prefer `cargo clippy --workspace --all-targets --all-features` before delivery to catch common static issues.',
          [StandardsRenderTarget.AGENTS]:
            'Prefer `cargo clippy --workspace --all-targets --all-features` before delivery.',
        },
      },
    },
    {
      ruleId: 'rule.rust.test.cargo-test',
      semanticKey: 'rule.rust.test.cargo-test',
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            '最小回归测试基线执行 `cargo test --workspace`；修改行为时需补齐测试。',
          [StandardsRenderTarget.AI]:
            'Run `cargo test --workspace` and add coverage for changed behavior.',
          [StandardsRenderTarget.AGENTS]:
            'Require `cargo test --workspace` and add coverage for changed behavior.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'Run `cargo test --workspace` as the minimal regression baseline and add coverage for changed behavior.',
          [StandardsRenderTarget.AI]:
            'Run `cargo test --workspace` and add coverage for changed behavior.',
          [StandardsRenderTarget.AGENTS]:
            'Require `cargo test --workspace` and add coverage for changed behavior.',
        },
      },
    },
  ],
};
