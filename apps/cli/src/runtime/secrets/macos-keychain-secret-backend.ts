import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type { CliSecretBackend, CliSecretBackendStatus } from './cli-secret-backend.interface.js';

type CliTextLocalizer = (english: string, chinese: string) => string;

const execFileAsync = promisify(execFile);
const KEYCHAIN_SERVICE_NAME = 'repo-ai-governor';
const DEFAULT_LOCALIZE_TEXT: CliTextLocalizer = (english) => english;

/**
 * Uses the macOS `security` CLI to store secrets in the user keychain.
 */
export class MacOsKeychainSecretBackend implements CliSecretBackend {
  public readonly backendId = 'macos-keychain';
  private localizeText: CliTextLocalizer = DEFAULT_LOCALIZE_TEXT;

  /**
   * Updates the runtime text localizer used by backend status and mutation failures.
   * @param localizeText Locale-aware English/Chinese text resolver.
   * @returns Void.
   */
  public setLocalizeText(localizeText: CliTextLocalizer): void {
    this.localizeText = localizeText;
  }

  public async getStatus(): Promise<CliSecretBackendStatus> {
    if (process.platform !== 'darwin') {
      return {
        backendId: this.backendId,
        available: false,
        detail: this.localizeText(
          'macOS keychain is only available on darwin.',
          'macOS keychain 仅在 darwin 平台可用。',
        ),
      };
    }

    try {
      await execFileAsync('security', ['list-keychains']);
      return {
        backendId: this.backendId,
        available: true,
        detail: KEYCHAIN_SERVICE_NAME,
      };
    } catch (error) {
      return {
        backendId: this.backendId,
        available: false,
        detail: this.localizeText(
          'security CLI is unavailable or keychain access failed.',
          'security CLI 不可用，或 keychain 访问失败。',
        ),
        warning: this.normalizeErrorMessage(error),
      };
    }
  }

  public async getSecret(keyName: string): Promise<string | null> {
    if (process.platform !== 'darwin') {
      return null;
    }

    try {
      const { stdout } = await execFileAsync('security', [
        'find-generic-password',
        '-a',
        keyName,
        '-s',
        KEYCHAIN_SERVICE_NAME,
        '-w',
      ]);
      const normalizedValue = stdout.trim();
      return normalizedValue.length > 0 ? normalizedValue : null;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw new RuntimeError(
        GovernorErrorCode.SECRET_OPERATION_FAILED,
        this.localizeText(
          `Failed to read secret ${keyName} from macOS keychain.`,
          `从 macOS keychain 读取 secret ${keyName} 失败。`,
        ),
        {
          backend: this.backendId,
          keyName,
        },
        error,
      );
    }
  }

  public async setSecret(keyName: string, value: string): Promise<void> {
    if (process.platform !== 'darwin') {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_BACKEND_UNAVAILABLE,
        this.localizeText(
          'macOS keychain backend is unavailable on the current platform.',
          '当前平台不可用 macOS keychain backend。',
        ),
        {
          backend: this.backendId,
        },
      );
    }

    try {
      await execFileAsync('security', [
        'add-generic-password',
        '-a',
        keyName,
        '-s',
        KEYCHAIN_SERVICE_NAME,
        '-U',
        '-w',
        value,
      ]);
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.SECRET_OPERATION_FAILED,
        this.localizeText(
          `Failed to write secret ${keyName} into macOS keychain.`,
          `向 macOS keychain 写入 secret ${keyName} 失败。`,
        ),
        {
          backend: this.backendId,
          keyName,
        },
        error,
      );
    }
  }

  public async deleteSecret(keyName: string): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return false;
    }

    try {
      await execFileAsync('security', [
        'delete-generic-password',
        '-a',
        keyName,
        '-s',
        KEYCHAIN_SERVICE_NAME,
      ]);
      return true;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw new RuntimeError(
        GovernorErrorCode.SECRET_OPERATION_FAILED,
        this.localizeText(
          `Failed to delete secret ${keyName} from macOS keychain.`,
          `从 macOS keychain 删除 secret ${keyName} 失败。`,
        ),
        {
          backend: this.backendId,
          keyName,
        },
        error,
      );
    }
  }

  private isNotFoundError(error: unknown): boolean {
    const message = this.normalizeErrorMessage(error).toLowerCase();
    return message.includes('could not be found') || message.includes('item not found');
  }

  private normalizeErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const stderr = (error as { stderr?: string }).stderr;
      if (typeof stderr === 'string' && stderr.trim().length > 0) {
        return stderr.trim();
      }
      const message = (error as { message?: string }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message.trim();
      }
    }
    return 'unknown_error';
  }
}
