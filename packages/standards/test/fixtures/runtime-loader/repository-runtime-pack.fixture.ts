export const repositoryRuntimePackFixture = {
  packId: 'pack.repository.runtime-fixture',
  packVersion: '1.0.0',
  packSource: 'repository',
  scope: 'repository',
  mergePrecedence: 100,
  status: 'active',
  rules: [
    {
      ruleId: 'rule.runtime.fixture.review.repository',
      semanticKey: 'rule.review.required',
      severity: 'required',
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          human: '仓库覆盖规则要求在合并前完成 review。',
          ai: '仓库覆盖规则要求在合并前完成 review。',
          agents: '仓库覆盖规则要求在合并前完成 review。',
        },
        'en-US': {
          human: 'Repository runtime fixture requires review before merge.',
          ai: 'Repository runtime fixture requires review before merge.',
          agents: 'Repository runtime fixture requires review before merge.',
        },
      },
    },
  ],
};
