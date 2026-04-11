import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type {
  CliSecretBackend,
  CliSecretBackendRecord,
  CliSecretBackendStatus,
} from './cli-secret-backend.interface.js';
import { CliSecretIndexService } from './cli-secret-index-service.js';
import { MacOsKeychainSecretBackend } from './macos-keychain-secret-backend.js';
import { UnsafeLocalFileSecretBackend } from './unsafe-local-file-secret-backend.js';

export type CliSecretBackendId = 'macos-keychain' | 'unsafe-local-file';
type CliTextLocalizer = (english: string, chinese: string) => string;

const SUPPORTED_SECRET_BACKENDS = new Set<string>(['macos-keychain', 'unsafe-local-file']);
const DEFAULT_LOCALIZE_TEXT: CliTextLocalizer = (english) => english;

interface CliSecretServiceDependencies {
  indexService?: CliSecretIndexService;
  backends?: Partial<Record<CliSecretBackendId, CliSecretBackend>>;
  localizeText?: CliTextLocalizer;
}

/**
 * Resolves backend selection, managed-secret index metadata, and credentialRef lookups.
 */
export class CliSecretService {
  private readonly indexService: CliSecretIndexService;
  private readonly backends: Record<CliSecretBackendId, CliSecretBackend>;
  private localizeText: CliTextLocalizer;

  public constructor(dependencies: CliSecretServiceDependencies = {}) {
    this.localizeText = dependencies.localizeText ?? DEFAULT_LOCALIZE_TEXT;
    this.indexService =
      dependencies.indexService ?? new CliSecretIndexService({ localizeText: this.localizeText });
    this.backends = {
      'macos-keychain':
        dependencies.backends?.['macos-keychain'] ?? new MacOsKeychainSecretBackend(),
      'unsafe-local-file':
        dependencies.backends?.['unsafe-local-file'] ?? new UnsafeLocalFileSecretBackend(),
    };
    this.setLocalizeText(this.localizeText);
  }

  /**
   * Updates the runtime text localizer used by secret services, index metadata, and default backends.
   * @param localizeText Locale-aware English/Chinese text resolver.
   * @returns Void.
   */
  public setLocalizeText(localizeText: CliTextLocalizer): void {
    this.localizeText = localizeText;
    this.indexService.setLocalizeText(localizeText);
    for (const backend of Object.values(this.backends)) {
      backend.setLocalizeText?.(localizeText);
    }
  }

  public validateKeyName(keyName: string): string {
    const normalizedKeyName = keyName.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9/_-]*$/u.test(normalizedKeyName)) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_INPUT_INVALID,
        this.localizeText(
          'Secret key names must use stable lowercase path segments like openai/api-key.',
          'Secret key 名称必须使用像 openai/api-key 这样的稳定小写路径段。',
        ),
        {
          keyName,
        },
      );
    }
    return normalizedKeyName;
  }

  public toSelector(keyName: string): string {
    return `secret://${this.validateKeyName(keyName)}`;
  }

  public parseSelector(selector: string): string {
    const normalizedSelector = selector.trim();
    if (!normalizedSelector.startsWith('secret://')) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_INPUT_INVALID,
        this.localizeText(
          `Unsupported secret selector "${selector}".`,
          `不支持的 secret selector "${selector}"。`,
        ),
        {
          selector,
        },
      );
    }
    return this.validateKeyName(normalizedSelector.slice('secret://'.length));
  }

  public async getStatus(
    options: {
      environment?: NodeJS.ProcessEnv;
      requestedBackendId?: string | null;
    } = {},
  ): Promise<{
    selectedBackendId: string | null;
    defaultBackendId: string | null;
    indexPath: string;
    backends: CliSecretBackendStatus[];
  }> {
    const environment = options.environment ?? process.env;
    const requestedBackendId = options.requestedBackendId?.trim().toLowerCase() ?? null;
    if (requestedBackendId !== null && !SUPPORTED_SECRET_BACKENDS.has(requestedBackendId)) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_BACKEND_UNAVAILABLE,
        this.localizeText(
          `Unsupported secret backend "${requestedBackendId}".`,
          `不支持的 secret backend "${requestedBackendId}"。`,
        ),
        {
          backend: requestedBackendId,
        },
      );
    }

    const backends = await Promise.all(
      this.resolveBackendOrder(environment).map(async (backendId) =>
        this.backends[backendId].getStatus(environment),
      ),
    );
    return {
      selectedBackendId: requestedBackendId ?? this.resolveDefaultBackendId(environment),
      defaultBackendId: this.resolveDefaultBackendId(environment),
      indexPath: this.indexService.resolveIndexPath(environment),
      backends,
    };
  }

  public async setSecret(options: {
    keyName: string;
    value: string;
    backendId?: string | null;
    environment?: NodeJS.ProcessEnv;
  }): Promise<{
    keyName: string;
    selector: string;
    backendId: string;
    warning: string | null;
  }> {
    const environment = options.environment ?? process.env;
    const keyName = this.validateKeyName(options.keyName);
    const value = options.value;
    if (value.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_INPUT_INVALID,
        this.localizeText('Secret input cannot be empty.', 'Secret 输入不能为空。'),
        {
          keyName,
        },
      );
    }

    const backend = await this.resolveWritableBackend(options.backendId ?? null, environment);
    await backend.setSecret(keyName, value, environment);
    await this.indexService.recordBackend(keyName, backend.backendId, environment);
    const status = await backend.getStatus(environment);
    return {
      keyName,
      selector: this.toSelector(keyName),
      backendId: backend.backendId,
      warning: status.warning ?? null,
    };
  }

  public async deleteSecret(options: {
    keyName: string;
    backendId?: string | null;
    environment?: NodeJS.ProcessEnv;
  }): Promise<{
    keyName: string;
    selector: string;
    deletedBackendIds: string[];
  }> {
    const environment = options.environment ?? process.env;
    const keyName = this.validateKeyName(options.keyName);
    const candidateBackendIds = options.backendId?.trim().toLowerCase()
      ? [this.normalizeBackendId(options.backendId)]
      : this.resolveCandidateBackendIds(keyName, environment);
    const deletedBackendIds: string[] = [];

    for (const backendId of candidateBackendIds) {
      const backend = this.backends[backendId];
      const deleted = await backend.deleteSecret(keyName, environment);
      if (deleted) {
        deletedBackendIds.push(backendId);
        await this.indexService.removeBackend(keyName, backendId, environment);
      }
    }

    if (deletedBackendIds.length === 0 && !options.backendId?.trim().length) {
      await this.indexService.removeBackend(keyName, null, environment);
    }

    return {
      keyName,
      selector: this.toSelector(keyName),
      deletedBackendIds,
    };
  }

  public async listSecrets(
    environment: NodeJS.ProcessEnv = process.env,
  ): Promise<CliSecretBackendRecord[]> {
    const records = this.indexService.loadIndex(environment);
    const secretRecords: CliSecretBackendRecord[] = [];

    for (const record of records) {
      for (const backendId of record.backendIds) {
        const normalizedBackendId = this.normalizeBackendId(backendId);
        const backend = this.backends[normalizedBackendId];
        const status = await backend.getStatus(environment);
        const value = status.available
          ? await backend.getSecret(record.keyName, environment)
          : null;
        secretRecords.push({
          keyName: record.keyName,
          selector: this.toSelector(record.keyName),
          backendId: normalizedBackendId,
          exists: value !== null,
          warning: status.warning ?? null,
        });
      }
    }

    return secretRecords.sort((left, right) => {
      const byKey = left.keyName.localeCompare(right.keyName);
      return byKey !== 0 ? byKey : left.backendId.localeCompare(right.backendId);
    });
  }

  public async resolveSecretValue(options: {
    selector: string;
    environment?: NodeJS.ProcessEnv;
  }): Promise<{
    keyName: string;
    backendId: string;
    value: string;
  } | null> {
    const environment = options.environment ?? process.env;
    const keyName = this.parseSelector(options.selector);
    for (const backendId of this.resolveCandidateBackendIds(keyName, environment)) {
      const backend = this.backends[backendId];
      const status = await backend.getStatus(environment);
      if (!status.available) {
        continue;
      }
      const value = await backend.getSecret(keyName, environment);
      if (value !== null) {
        return {
          keyName,
          backendId,
          value,
        };
      }
    }
    return null;
  }

  private resolveDefaultBackendId(environment: NodeJS.ProcessEnv): CliSecretBackendId | null {
    return environment.REPO_AI_GOVERNOR_SECRET_BACKEND?.trim().length
      ? this.normalizeBackendId(environment.REPO_AI_GOVERNOR_SECRET_BACKEND)
      : process.platform === 'darwin'
        ? 'macos-keychain'
        : null;
  }

  private resolveBackendOrder(environment: NodeJS.ProcessEnv): CliSecretBackendId[] {
    const defaultBackendId = this.resolveDefaultBackendId(environment);
    const orderedBackendIds: CliSecretBackendId[] = [];
    if (defaultBackendId) {
      orderedBackendIds.push(defaultBackendId);
    }
    for (const backendId of Object.keys(this.backends) as CliSecretBackendId[]) {
      if (!orderedBackendIds.includes(backendId)) {
        orderedBackendIds.push(backendId);
      }
    }
    return orderedBackendIds;
  }

  private async resolveWritableBackend(
    requestedBackendId: string | null,
    environment: NodeJS.ProcessEnv,
  ): Promise<CliSecretBackend> {
    const backendId =
      requestedBackendId?.trim().toLowerCase() ?? this.resolveDefaultBackendId(environment);
    if (!backendId) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_BACKEND_UNAVAILABLE,
        this.localizeText(
          'No default secret backend is available on the current platform; pass --backend unsafe-local-file to opt into the local-only fallback.',
          '当前平台没有可用的默认 secret backend；如需启用仅限本地的 fallback，请传入 --backend unsafe-local-file。',
        ),
      );
    }

    const normalizedBackendId = this.normalizeBackendId(backendId);
    const backend = this.backends[normalizedBackendId];
    const status = await backend.getStatus(environment);
    if (!status.available) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_BACKEND_UNAVAILABLE,
        this.localizeText(
          `Secret backend "${normalizedBackendId}" is unavailable: ${status.detail}.`,
          `Secret backend "${normalizedBackendId}" 当前不可用：${status.detail}。`,
        ),
        {
          backend: normalizedBackendId,
        },
      );
    }
    return backend;
  }

  private resolveCandidateBackendIds(
    keyName: string,
    environment: NodeJS.ProcessEnv,
  ): CliSecretBackendId[] {
    const indexedBackendIds = this.indexService.resolveBackendsForKey(keyName, environment);
    const orderedBackendIds: CliSecretBackendId[] = [];
    for (const backendId of indexedBackendIds) {
      const normalizedBackendId = this.normalizeBackendId(backendId);
      if (!orderedBackendIds.includes(normalizedBackendId)) {
        orderedBackendIds.push(normalizedBackendId);
      }
    }
    for (const backendId of this.resolveBackendOrder(environment)) {
      if (!orderedBackendIds.includes(backendId)) {
        orderedBackendIds.push(backendId);
      }
    }
    return orderedBackendIds;
  }

  private normalizeBackendId(backendId: string): CliSecretBackendId {
    const normalizedBackendId = backendId.trim().toLowerCase();
    if (!SUPPORTED_SECRET_BACKENDS.has(normalizedBackendId)) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_BACKEND_UNAVAILABLE,
        this.localizeText(
          `Unsupported secret backend "${backendId}".`,
          `不支持的 secret backend "${backendId}"。`,
        ),
        {
          backend: backendId,
        },
      );
    }
    return normalizedBackendId as CliSecretBackendId;
  }
}
