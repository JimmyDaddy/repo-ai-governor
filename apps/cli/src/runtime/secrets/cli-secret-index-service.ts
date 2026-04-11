import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';

type CliTextLocalizer = (english: string, chinese: string) => string;

interface CliSecretIndexDocument {
  schemaVersion: '1';
  records: Array<{
    keyName: string;
    backendIds: string[];
    updatedAt: string;
  }>;
}

export interface CliSecretIndexRecord {
  keyName: string;
  backendIds: string[];
  updatedAt: string;
}

const SECRET_INDEX_FILE_NAME = 'secret-index.json';
const DEFAULT_LOCALIZE_TEXT: CliTextLocalizer = (english) => english;

interface CliSecretIndexServiceDependencies {
  localizeText?: CliTextLocalizer;
}

/**
 * Persists non-secret metadata about which managed backends currently own each secret key.
 */
export class CliSecretIndexService {
  private localizeText: CliTextLocalizer;

  public constructor(dependencies: CliSecretIndexServiceDependencies = {}) {
    this.localizeText = dependencies.localizeText ?? DEFAULT_LOCALIZE_TEXT;
  }

  /**
   * Updates the runtime text localizer used by index read/write failures.
   * @param localizeText Locale-aware English/Chinese text resolver.
   * @returns Void.
   */
  public setLocalizeText(localizeText: CliTextLocalizer): void {
    this.localizeText = localizeText;
  }

  public resolveIndexPath(environment: NodeJS.ProcessEnv = process.env): string {
    return resolve(
      this.resolveHomeDirectory(environment),
      '.repo-ai-governor',
      SECRET_INDEX_FILE_NAME,
    );
  }

  public loadIndex(environment: NodeJS.ProcessEnv = process.env): CliSecretIndexRecord[] {
    const indexPath = this.resolveIndexPath(environment);
    try {
      const rawContent = readFileSync(indexPath, 'utf8');
      const parsedDocument = JSON.parse(rawContent) as CliSecretIndexDocument;
      if (!Array.isArray(parsedDocument.records)) {
        return [];
      }
      return parsedDocument.records
        .filter((record) => typeof record?.keyName === 'string')
        .map((record) => ({
          keyName: record.keyName,
          backendIds: Array.isArray(record.backendIds)
            ? Array.from(
                new Set(record.backendIds.filter((backendId) => typeof backendId === 'string')),
              )
            : [],
          updatedAt:
            typeof record.updatedAt === 'string' && record.updatedAt.trim().length > 0
              ? record.updatedAt
              : new Date(0).toISOString(),
        }))
        .sort((left, right) => left.keyName.localeCompare(right.keyName));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new RuntimeError(
        GovernorErrorCode.SECRET_OPERATION_FAILED,
        this.localizeText(
          `Failed to load secret index at ${indexPath}.`,
          `加载 ${indexPath} 处的 secret 索引失败。`,
        ),
        {
          indexPath,
        },
        error,
      );
    }
  }

  public async recordBackend(
    keyName: string,
    backendId: string,
    environment: NodeJS.ProcessEnv = process.env,
  ): Promise<void> {
    const records = this.loadIndex(environment);
    const existingRecord = records.find((record) => record.keyName === keyName);
    const updatedAt = new Date().toISOString();
    if (existingRecord) {
      existingRecord.backendIds = [
        backendId,
        ...existingRecord.backendIds.filter(
          (candidateBackendId) => candidateBackendId !== backendId,
        ),
      ];
      existingRecord.updatedAt = updatedAt;
    } else {
      records.push({
        keyName,
        backendIds: [backendId],
        updatedAt,
      });
    }

    await this.writeIndex(records, environment);
  }

  public async removeBackend(
    keyName: string,
    backendId: string | null,
    environment: NodeJS.ProcessEnv = process.env,
  ): Promise<void> {
    const records = this.loadIndex(environment)
      .map((record) => {
        if (record.keyName !== keyName) {
          return record;
        }
        if (backendId === null) {
          return null;
        }
        const nextBackendIds = record.backendIds.filter((candidate) => candidate !== backendId);
        if (nextBackendIds.length === 0) {
          return null;
        }
        return {
          ...record,
          backendIds: nextBackendIds,
          updatedAt: new Date().toISOString(),
        };
      })
      .filter((record): record is CliSecretIndexRecord => record !== null);

    await this.writeIndex(records, environment);
  }

  public resolveBackendsForKey(
    keyName: string,
    environment: NodeJS.ProcessEnv = process.env,
  ): string[] {
    return (
      this.loadIndex(environment).find((record) => record.keyName === keyName)?.backendIds ?? []
    );
  }

  private async writeIndex(
    records: CliSecretIndexRecord[],
    environment: NodeJS.ProcessEnv,
  ): Promise<void> {
    const indexPath = this.resolveIndexPath(environment);
    await mkdir(dirname(indexPath), { recursive: true });
    const document: CliSecretIndexDocument = {
      schemaVersion: '1',
      records: [...records].sort((left, right) => left.keyName.localeCompare(right.keyName)),
    };
    await writeFile(indexPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
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
        'Unable to resolve the current home directory for secret metadata.',
        '无法解析 secret 元数据对应的当前 home 目录。',
      ),
    );
  }
}
