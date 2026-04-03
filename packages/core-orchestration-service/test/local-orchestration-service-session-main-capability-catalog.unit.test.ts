import { DEFAULT_I18N_RUNTIME_CONFIG, I18nRuntime, Locale } from '@repo-ai-governor/shared';
import {
  LocalOrchestrationServiceSessionMainCapabilityCatalog,
  SESSION_MAIN_CAPABILITY_CATALOG_OWNER_MODULE_ID,
  SESSION_MAIN_CAPABILITY_DESCRIPTOR_VERSION,
  SESSION_MAIN_CAPABILITY_ID,
} from '../src/index.js';

describe('LocalOrchestrationServiceSessionMainCapabilityCatalog', () => {
  it('publishes one orchestration-owned seed for each governed capability id', () => {
    const catalog = new LocalOrchestrationServiceSessionMainCapabilityCatalog();

    expect(catalog.listDescriptorSeeds()).toEqual([
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.HELP,
        ownerModuleId: SESSION_MAIN_CAPABILITY_CATALOG_OWNER_MODULE_ID,
        descriptorVersion: SESSION_MAIN_CAPABILITY_DESCRIPTOR_VERSION,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.CONNECT,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.DOCTOR,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.VERIFY,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.WORKFLOW,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
      }),
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.RUN,
      }),
    ]);
  });

  it('renders localized descriptor views through the shared i18n runtime', async () => {
    const catalog = new LocalOrchestrationServiceSessionMainCapabilityCatalog();
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, Locale.EN_US);

    const reviewView = catalog.getDescriptorView(SESSION_MAIN_CAPABILITY_ID.REVIEW, (key) =>
      i18nRuntime.t(key),
    );

    expect(reviewView).toEqual(
      expect.objectContaining({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
        title: 'Review',
        suggestedSlashCommand: '/review',
        handoffExecutionMode: 'direct_execute',
        confirmationRequired: false,
        examplePrompts: ['Review the current changes.', 'Help me do a code review on this branch.'],
      }),
    );
  });

  it('does not let consumers mutate the internal canonical seed truth through accessor return values', () => {
    const catalog = new LocalOrchestrationServiceSessionMainCapabilityCatalog();

    const returnedSeed = catalog.getDescriptorSeed(SESSION_MAIN_CAPABILITY_ID.REVIEW);
    expect(returnedSeed).not.toBeNull();

    const mutableSeed = returnedSeed as unknown as {
      skillId: string;
      relatedCapabilityIds: string[];
    };
    mutableSeed.skillId = 'skill.hijacked';
    mutableSeed.relatedCapabilityIds.push('workflow');

    const freshSeed = catalog.getDescriptorSeed(SESSION_MAIN_CAPABILITY_ID.REVIEW);
    expect(freshSeed).toEqual(
      expect.objectContaining({
        skillId: 'skill.review.code',
        relatedCapabilityIds: [
          SESSION_MAIN_CAPABILITY_ID.PLAN,
          SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
        ],
      }),
    );
  });
});
