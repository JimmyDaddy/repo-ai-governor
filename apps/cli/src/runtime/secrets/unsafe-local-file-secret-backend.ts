import { readFileSync } from 'node:fs';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type { CliSecretBackend, CliSecretBackendStatus } from './cli-secret-backend.interface.js';

type CliTextLocalizer = (english: string, chinese: string) => string;

interface UnsafeLocalFileSecretDocument {
  schemaVersion: '1';
  secrets: Record<string, string>;
}

const UNSAFE_SECRET_FILE_NAME = 'secrets.json';
const DEFAULT_LOCALIZE_TEXT: CliTextLocalizer = (english) => english;
const UNSAFE_SECRET_DIRECTORY_MODE = 0o700;
const UNSAFE_SECRET_FILE_MODE = 0o600;

/**
 * Stores secrets in a user-local JSON file as an explicit unsafe fallback backend.
 */
export class UnsafeLocalFileSecretBackend implements CliSecretBackend {
  public readonly backendId = 'unsafe-local-file';
  private localizeText: CliTextLocalizer = DEFAULT_LOCALIZE_TEXT;

  /**
   * Updates the runtime text localizer used by backend status and mutation failures.
   * @param localizeText Locale-aware English/Chinese text resolver.
   * @returns Void.
   */
  public setLocalizeText(localizeText: CliTextLocalizer): void {
    this.localizeText = localizeText;
  }

  public async getStatus(
    environment: NodeJS.ProcessEnv = process.env,
  ): Promise<CliSecretBackendStatus> {
    return {
      backendId: this.backendId,
      available: true,
      detail: this.resolveSecretFilePath(environment),
      warning: this.localizeText(
        'unsafe-local-file stores plaintext secrets on disk; use it only with explicit local-only opt-in.',
        'unsafe-local-file 会把明文 secret 写入磁盘；只能在显式确认 local-only opt-in 后使用。',
      ),
    };
  }

  public async getSecret(
    keyName: string,
    environment: NodeJS.ProcessEnv = process.env,
  ): Promise<string | null> {
    return this.loadDocument(environment).secrets[keyName] ?? null;
  }

  public async setSecret(
    keyName: string,
    value: string,
    environment: NodeJS.ProcessEnv = process.env,
  ): Promise<void> {
    const document = this.loadDocument(environment);
    document.secrets[keyName] = value;
    await this.writeDocument(document, environment);
  }

  public async deleteSecret(
    keyName: string,
    environment: NodeJS.ProcessEnv = process.env,
  ): Promise<boolean> {
    const document = this.loadDocument(environment);
    if (!(keyName in document.secrets)) {
      return false;
    }
    delete document.secrets[keyName];
    await this.writeDocument(document, environment);
    return true;
  }

  public resolveSecretFilePath(environment: NodeJS.ProcessEnv = process.env): string {
    return resolve(
      this.resolveHomeDirectory(environment),
      '.repo-ai-governor',
      UNSAFE_SECRET_FILE_NAME,
    );
  }

  private loadDocument(environment: NodeJS.ProcessEnv): UnsafeLocalFileSecretDocument {
    const secretFilePath = this.resolveSecretFilePath(environment);
    try {
      const rawContent = readFileSync(secretFilePath, 'utf8');
      const parsedDocument = JSON.parse(rawContent) as UnsafeLocalFileSecretDocument;
      return {
        schemaVersion: '1',
        secrets:
          parsedDocument && typeof parsedDocument === 'object' && parsedDocument.secrets
            ? parsedDocument.secrets
            : {},
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          schemaVersion: '1',
          secrets: {},
        };
      }
      throw new RuntimeError(
        GovernorErrorCode.SECRET_OPERATION_FAILED,
        this.localizeText(
          `Failed to load unsafe local secret file at ${secretFilePath}.`,
          `加载 ${secretFilePath} 处的非安全本地 secret 文件失败。`,
        ),
        {
          backend: this.backendId,
          secretFilePath,
        },
        error,
      );
    }
  }

  private async writeDocument(
    document: UnsafeLocalFileSecretDocument,
    environment: NodeJS.ProcessEnv,
  ): Promise<void> {
    const secretFilePath = this.resolveSecretFilePath(environment);
    const secretDirectoryPath = dirname(secretFilePath);
    await mkdir(secretDirectoryPath, {
      recursive: true,
      mode: UNSAFE_SECRET_DIRECTORY_MODE,
    });
    await chmod(secretDirectoryPath, UNSAFE_SECRET_DIRECTORY_MODE);
    await writeFile(secretFilePath, `${JSON.stringify(document, null, 2)}\n`, {
      encoding: 'utf8',
      mode: UNSAFE_SECRET_FILE_MODE,
    });
    await chmod(secretFilePath, UNSAFE_SECRET_FILE_MODE);
  }

  private resolveHomeDirectory(environment: NodeJS.ProcessEnv): string {
    const homeDirectoryCandidate = environment.HOME?.trim();
    if (homeDirectoryCandidate && homeDirectoryCandidate.length > 0) {
      return resolve(homeDirectoryCandidate);
    }

    const systemHomeDirectory = homedir().trim();
    if (systemHomeDirectory.length > 0) {
      return resolve(systemHomeDirectory);
    }

    throw new RuntimeError(
      GovernorErrorCode.USER_CONFIG_PATH_INVALID,
      this.localizeText(
        'Unable to resolve the current home directory for secret storage.',
        '无法解析 secret 存储对应的当前 home 目录。',
      ),
    );
  }
}
