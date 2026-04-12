import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import type {
  CliSecretBackend,
  CliSecretBackendStatus,
} from '../../src/runtime/secrets/cli-secret-backend.interface.js';
import { CliSecretService } from '../../src/runtime/secrets/cli-secret-service.js';
import { UnsafeLocalFileSecretBackend } from '../../src/runtime/secrets/unsafe-local-file-secret-backend.js';

class InMemorySecretBackend implements CliSecretBackend {
  public readonly backendId: string;
  private readonly records = new Map<string, string>();
  private readonly statusWarning: string | null;
  private readonly statusDetail: string;
  private readonly statusAvailable: boolean;

  public constructor(
    backendId: string,
    options: {
      available?: boolean;
      detail?: string;
      warning?: string | null;
    } = {},
  ) {
    this.backendId = backendId;
    this.statusAvailable = options.available ?? true;
    this.statusDetail = options.detail ?? backendId;
    this.statusWarning = options.warning ?? null;
  }

  public async getStatus(): Promise<CliSecretBackendStatus> {
    return {
      backendId: this.backendId,
      available: this.statusAvailable,
      detail: this.statusDetail,
      warning: this.statusWarning,
    };
  }

  public async getSecret(keyName: string): Promise<string | null> {
    return this.records.get(keyName) ?? null;
  }

  public async setSecret(keyName: string, value: string): Promise<void> {
    this.records.set(keyName, value);
  }

  public async deleteSecret(keyName: string): Promise<boolean> {
    const existed = this.records.has(keyName);
    this.records.delete(keyName);
    return existed;
  }
}

describe('CliSecretService', () => {
  it('keeps sidecar index metadata when an explicit backend delete misses another live backend', async () => {
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-secret-service-'));
    const environment = {
      ...process.env,
      HOME: temporaryHomeRoot,
    };
    const service = new CliSecretService({
      backends: {
        'macos-keychain': new InMemorySecretBackend('macos-keychain'),
        'unsafe-local-file': new InMemorySecretBackend('unsafe-local-file'),
      },
    });

    try {
      await service.setSecret({
        keyName: 'openai/api-key',
        value: 'sk-live',
        backendId: 'unsafe-local-file',
        environment,
      });

      const deleteResult = await service.deleteSecret({
        keyName: 'openai/api-key',
        backendId: 'macos-keychain',
        environment,
      });
      const listedRecords = await service.listSecrets(environment);

      expect(deleteResult.deletedBackendIds).toEqual([]);
      expect(listedRecords).toEqual([
        expect.objectContaining({
          keyName: 'openai/api-key',
          backendId: 'unsafe-local-file',
          exists: true,
        }),
      ]);
    } finally {
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('resolves the most recently indexed backend before falling back to global backend order', async () => {
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-secret-service-order-'));
    const environment = {
      ...process.env,
      HOME: temporaryHomeRoot,
      REPO_AI_GOVERNOR_SECRET_BACKEND: 'macos-keychain',
    };
    const macOsBackend = new InMemorySecretBackend('macos-keychain');
    const unsafeBackend = new InMemorySecretBackend('unsafe-local-file');
    const service = new CliSecretService({
      backends: {
        'macos-keychain': macOsBackend,
        'unsafe-local-file': unsafeBackend,
      },
    });

    try {
      await service.setSecret({
        keyName: 'openai/api-key',
        value: 'sk-stale',
        backendId: 'macos-keychain',
        environment,
      });
      await service.setSecret({
        keyName: 'openai/api-key',
        value: 'sk-fresh',
        backendId: 'unsafe-local-file',
        environment,
      });

      const resolvedSecret = await service.resolveSecretValue({
        selector: 'secret://openai/api-key',
        environment,
      });

      expect(resolvedSecret).toEqual({
        keyName: 'openai/api-key',
        backendId: 'unsafe-local-file',
        value: 'sk-fresh',
      });
    } finally {
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('returns backend warning metadata when an explicit unsafe fallback backend is selected', async () => {
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-secret-service-warning-'));
    const environment = {
      ...process.env,
      HOME: temporaryHomeRoot,
    };
    const warning =
      'unsafe-local-file stores plaintext secrets on disk; use it only with explicit local-only opt-in.';
    const service = new CliSecretService({
      backends: {
        'macos-keychain': new InMemorySecretBackend('macos-keychain'),
        'unsafe-local-file': new InMemorySecretBackend('unsafe-local-file', {
          warning,
        }),
      },
    });

    try {
      const result = await service.setSecret({
        keyName: 'openai/api-key',
        value: 'sk-live',
        backendId: 'unsafe-local-file',
        environment,
      });

      expect(result).toEqual({
        keyName: 'openai/api-key',
        selector: 'secret://openai/api-key',
        backendId: 'unsafe-local-file',
        warning,
      });
      expect(Object.values(result)).not.toContain('sk-live');
    } finally {
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('hardens unsafe fallback storage permissions to owner-only on POSIX hosts', async () => {
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-secret-file-mode-'));
    const environment = {
      ...process.env,
      HOME: temporaryHomeRoot,
    };
    const backend = new UnsafeLocalFileSecretBackend();

    try {
      await backend.setSecret('openai/api-key', 'sk-live', environment);
      const secretFilePath = backend.resolveSecretFilePath(environment);

      if (process.platform === 'win32') {
        expect(secretFilePath).toContain('secrets.json');
        return;
      }

      const directoryMode = (await stat(dirname(secretFilePath))).mode & 0o777;
      const fileMode = (await stat(secretFilePath)).mode & 0o777;

      expect(directoryMode).toBe(0o700);
      expect(fileMode).toBe(0o600);
    } finally {
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });
});
