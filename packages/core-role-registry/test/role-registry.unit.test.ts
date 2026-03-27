import {
  DefaultRoleProfileId,
  GovernorErrorCode,
  RoleProfileStatus,
  RoleSource,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { RoleRegistry } from '../src/index.js';
import type { RoleProfile } from '../src/index.js';

function createCustomProfile(overrides: Partial<RoleProfile> = {}): RoleProfile {
  return {
    roleProfileId: 'custom-reviewer-default',
    roleProfileVersion: '1.0.0',
    displayName: 'Custom Reviewer',
    responsibilities: ['review_changes'],
    capabilities: ['structured_output'],
    permissionCeiling: ['read', 'test'],
    roleSource: RoleSource.CUSTOM,
    status: RoleProfileStatus.ACTIVE,
    lifecycle: {
      aliases: [],
      supersedes: [],
    },
    ...overrides,
  };
}

describe('RoleRegistry unit', () => {
  it('resolves default profiles and custom aliases', () => {
    const roleRegistry = new RoleRegistry({
      customProfiles: [
        createCustomProfile({
          roleProfileId: 'custom-reviewer-v2',
          lifecycle: {
            aliases: ['reviewer-custom'],
            supersedes: [],
          },
        }),
      ],
    });

    const defaultResolved = roleRegistry.resolveOrThrow(DefaultRoleProfileId.PLANNER, {
      executionId: 'exec-role-001',
      stageId: 'stage-planning',
    });
    const aliasResolved = roleRegistry.resolveOrThrow('reviewer-custom');

    expect(defaultResolved.profile.roleSource).toBe(RoleSource.DEFAULT);
    expect(defaultResolved.auditRecord.executionId).toBe('exec-role-001');
    expect(aliasResolved.profile.roleProfileId).toBe('custom-reviewer-v2');
    expect(aliasResolved.auditRecord.resolvedByAlias).toBe(true);
  });

  it('resolves deprecated profiles to replacement profile when replacedBy is declared', () => {
    const roleRegistry = new RoleRegistry({
      customProfiles: [
        createCustomProfile({
          roleProfileId: 'coder-v2',
          roleProfileVersion: '2.0.0',
          displayName: 'Coder V2',
        }),
        createCustomProfile({
          roleProfileId: 'coder-v1',
          roleProfileVersion: '1.4.0',
          displayName: 'Coder V1',
          status: RoleProfileStatus.DEPRECATED,
          lifecycle: {
            aliases: ['legacy-coder'],
            supersedes: [],
            replacedBy: 'coder-v2',
          },
        }),
      ],
    });

    const resolved = roleRegistry.resolveOrThrow('legacy-coder');

    expect(resolved.profile.roleProfileId).toBe('coder-v2');
    expect(resolved.auditRecord.resolvedByReplacement).toBe(true);
  });

  it('throws duplicate error when role profile id conflicts', () => {
    expect(
      () =>
        new RoleRegistry({
          customProfiles: [
            createCustomProfile({
              roleProfileId: 'duplicate-role',
            }),
            createCustomProfile({
              roleProfileId: 'duplicate-role',
              displayName: 'Duplicate Role',
            }),
          ],
        }),
    ).toThrowError(RuntimeError);

    try {
      new RoleRegistry({
        customProfiles: [
          createCustomProfile({ roleProfileId: 'duplicate-role' }),
          createCustomProfile({ roleProfileId: 'duplicate-role', displayName: 'Duplicate Role' }),
        ],
      });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.ROLE_REGISTRY_PROFILE_DUPLICATE);
    }
  });

  it('throws retired error when resolved profile is retired', () => {
    const roleRegistry = new RoleRegistry({
      customProfiles: [
        createCustomProfile({
          roleProfileId: 'retired-role',
          status: RoleProfileStatus.RETIRED,
          lifecycle: {
            aliases: ['legacy-retired'],
            supersedes: [],
          },
        }),
      ],
    });

    expect(() => roleRegistry.resolveOrThrow('legacy-retired')).toThrowError(RuntimeError);

    try {
      roleRegistry.resolveOrThrow('legacy-retired');
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.ROLE_REGISTRY_PROFILE_RETIRED);
    }
  });
});
