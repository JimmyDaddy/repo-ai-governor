export const officialRuntimePackFixture = {
  packId: 'pack.official.runtime-fixture',
  packVersion: '1.0.0',
  packSource: 'official',
  scope: 'global',
  mergePrecedence: 10,
  status: 'active',
  rules: [
    {
      ruleId: 'rule.runtime.fixture.review',
      semanticKey: 'rule.review.required',
      severity: 'required',
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          human: '正式规则要求在提交前完成 review。',
          ai: '正式规则要求在提交前完成 review。',
          agents: '正式规则要求在提交前完成 review。',
        },
        'en-US': {
          human: 'Official runtime fixture requires review before commit.',
          ai: 'Official runtime fixture requires review before commit.',
          agents: 'Official runtime fixture requires review before commit.',
        },
      },
    },
  ],
};
