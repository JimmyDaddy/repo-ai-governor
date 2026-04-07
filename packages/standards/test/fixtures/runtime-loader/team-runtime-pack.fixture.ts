export const teamRuntimePackFixture = {
  packId: 'pack.team.runtime-fixture',
  packVersion: '1.0.0',
  packSource: 'team',
  scope: 'team',
  mergePrecedence: 50,
  status: 'active',
  rules: [
    {
      ruleId: 'rule.runtime.fixture.review.team',
      semanticKey: 'rule.review.required',
      severity: 'required',
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          human: '团队规则要求在共享交付前完成 review。',
          ai: '团队规则要求在共享交付前完成 review。',
          agents: '团队规则要求在共享交付前完成 review。',
        },
        'en-US': {
          human: 'Team runtime fixture requires review before shared delivery.',
          ai: 'Team runtime fixture requires review before shared delivery.',
          agents: 'Team runtime fixture requires review before shared delivery.',
        },
      },
    },
    {
      ruleId: 'rule.runtime.fixture.handoff.team',
      semanticKey: 'rule.handoff.required',
      severity: 'recommended',
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          human: '团队规则建议在交接时附带维护者说明。',
          ai: '团队规则建议在交接时附带维护者说明。',
          agents: '团队规则建议在交接时附带维护者说明。',
        },
        'en-US': {
          human: 'Team runtime fixture recommends a maintainer handoff note.',
          ai: 'Team runtime fixture recommends a maintainer handoff note.',
          agents: 'Team runtime fixture recommends a maintainer handoff note.',
        },
      },
    },
  ],
};
