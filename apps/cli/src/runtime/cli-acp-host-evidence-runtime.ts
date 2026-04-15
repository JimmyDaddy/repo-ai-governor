import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

import { AdapterSurface } from '@repo-ai-governor/shared';
import {
  HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION,
  HostDistributionHost,
  HostDistributionTarget,
  type HostExportManifest,
  HostVerificationStatus,
  type HostVerificationSummary,
} from '@repo-ai-governor/standards';
import {
  CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY,
  CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
  CLI_ACP_HOST_DISTRIBUTION_READY_STATE_SUMMARY,
  CLI_ACP_HOST_RUNTIME_AND_DISTRIBUTION_READY_STATE_SUMMARY,
  CLI_ACP_HOST_RUNTIME_SERVICE_READY_STATE_SUMMARY,
  CliAcpHostDistributionBoundary,
  CliAcpHostReadinessStatus,
} from '../constants/cli-acp-host.constant.js';

interface CliAcpHostEvidenceResolution {
  hostReadinessStatus: string;
  distributionBoundary: string;
  companionStateSummary: string;
}

interface CliAcpHostVerificationRecord {
  target: string;
  status: string;
  verifiedAt: string;
}

interface CliAcpCleanRoomVerificationSummary {
  schemaVersion: string;
  overallStatus?: string;
  distributionMode?: string;
  surfaces?: Array<{
    surfaceId?: string;
    status?: string;
    verifiedModes?: string[];
    runtimeServiceVerificationSummaryPaths?: string[];
    packagedDistributionVerificationSummaryPaths?: string[];
  }>;
}

const ACP_CLEAN_ROOM_VERIFICATION_SUMMARY_SCHEMA_VERSION = 'acp-cleanroom-verification-summary-v1';
const ACP_CLEAN_ROOM_VERIFICATION_REQUIRED_STATUS = 'passed';
const ACP_CLEAN_ROOM_VERIFICATION_REQUIRED_DISTRIBUTION_MODE = 'default';
const ACP_CLEAN_ROOM_VERIFICATION_REQUIRED_MODES = ['link', 'path', 'tgz'] as const;
const ACP_CLEAN_ROOM_TRACKED_RECEIPTS_DIRECTORY = 'acp-cleanroom-verification.receipts';
const ACP_CLEAN_ROOM_VERIFICATION_SUMMARY_RELATIVE_PATH = [
  '.repo-ai-governor',
  'generated',
  'acp',
  'acp-cleanroom-verification.summary.json',
];

const ACP_HOST_CONFIG_BY_SURFACE: Partial<
  Record<
    AdapterSurface,
    {
      host: HostDistributionHost;
      runtimeTargets: HostDistributionTarget[];
      distributionTargets: HostDistributionTarget[];
    }
  >
> = {
  [AdapterSurface.CODEX]: {
    host: HostDistributionHost.CODEX,
    runtimeTargets: [HostDistributionTarget.CODEX_PROJECT_LOCAL],
    distributionTargets: [HostDistributionTarget.CODEX_PLUGIN],
  },
  [AdapterSurface.CLAUDE_CODE]: {
    host: HostDistributionHost.CLAUDE_CODE,
    runtimeTargets: [HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL],
    distributionTargets: [HostDistributionTarget.CLAUDE_CODE_PLUGIN],
  },
  [AdapterSurface.GITHUB_COPILOT]: {
    host: HostDistributionHost.GITHUB_COPILOT,
    runtimeTargets: [HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL],
    distributionTargets: [HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN],
  },
};

/**
 * Reads rollout evidence written by host/adoption workflows and projects it into ACP companion
 * readiness posture without changing ACP's fail-closed execution semantics.
 */
export class CliAcpHostEvidenceRuntime {
  public constructor(private readonly workspaceRoot: string) {}

  public resolveEvidence(surface: AdapterSurface): CliAcpHostEvidenceResolution | null {
    const config = ACP_HOST_CONFIG_BY_SURFACE[surface];
    if (!config) {
      return null;
    }

    const latestRecordByTarget = this.collectLatestVerificationRecordsByTarget(config.host);
    const runtimeServiceReady = config.runtimeTargets.some(
      (target) => latestRecordByTarget.get(target)?.status === HostVerificationStatus.PASS,
    );
    const packagedDistributionReady = config.distributionTargets.some(
      (target) => latestRecordByTarget.get(target)?.status === HostVerificationStatus.PASS,
    );
    const cleanRoomVerified = this.resolveCleanRoomVerification(surface);

    if (!runtimeServiceReady && !packagedDistributionReady) {
      return null;
    }

    return {
      hostReadinessStatus: runtimeServiceReady
        ? CliAcpHostReadinessStatus.RUNTIME_SERVICE_READY
        : CliAcpHostReadinessStatus.RUNTIME_SERVICE_ENABLEMENT_PENDING,
      distributionBoundary: packagedDistributionReady
        ? CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_READY
        : CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_PENDING,
      companionStateSummary: this.resolveCompanionStateSummary({
        runtimeServiceReady,
        packagedDistributionReady,
        cleanRoomVerified,
      }),
    };
  }

  private collectLatestVerificationRecordsByTarget(
    host: HostDistributionHost,
  ): Map<string, CliAcpHostVerificationRecord> {
    const generatedRoot = resolve(this.workspaceRoot, '.repo-ai-governor', 'generated');
    if (!existsSync(generatedRoot)) {
      return new Map();
    }

    const latestRecordByTarget = new Map<string, CliAcpHostVerificationRecord>();
    for (const generatedBucket of readdirSync(generatedRoot, { withFileTypes: true })) {
      if (!generatedBucket.isDirectory() || !generatedBucket.name.startsWith('hosts')) {
        continue;
      }

      const bucketRoot = resolve(generatedRoot, generatedBucket.name);
      for (const exportDirectory of readdirSync(bucketRoot, { withFileTypes: true })) {
        if (!exportDirectory.isDirectory()) {
          continue;
        }

        const summaryPath = resolve(
          bucketRoot,
          exportDirectory.name,
          'host-verification.summary.json',
        );
        const manifestPath = resolve(bucketRoot, exportDirectory.name, 'host-export.manifest.json');
        if (!existsSync(summaryPath) || !existsSync(manifestPath)) {
          continue;
        }

        const summary = this.readJsonFile<HostVerificationSummary>(summaryPath);
        const manifest = this.readJsonFile<HostExportManifest>(manifestPath);
        if (!summary || !manifest) {
          continue;
        }
        if (
          summary.schemaVersion !== HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION ||
          manifest.host !== host
        ) {
          continue;
        }

        const currentRecord: CliAcpHostVerificationRecord = {
          target: manifest.target,
          status: summary.status,
          verifiedAt: summary.verifiedAt,
        };
        const previousRecord = latestRecordByTarget.get(manifest.target);
        if (!previousRecord) {
          latestRecordByTarget.set(manifest.target, currentRecord);
          continue;
        }

        const currentTimestamp = Date.parse(currentRecord.verifiedAt);
        const previousTimestamp = Date.parse(previousRecord.verifiedAt);
        if (
          Number.isFinite(currentTimestamp) &&
          (!Number.isFinite(previousTimestamp) || currentTimestamp >= previousTimestamp)
        ) {
          latestRecordByTarget.set(manifest.target, currentRecord);
        }
      }
    }

    return latestRecordByTarget;
  }

  private resolveCompanionStateSummary(options: {
    runtimeServiceReady: boolean;
    packagedDistributionReady: boolean;
    cleanRoomVerified: boolean;
  }): string {
    if (
      options.runtimeServiceReady &&
      options.packagedDistributionReady &&
      options.cleanRoomVerified
    ) {
      return CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY;
    }
    if (options.runtimeServiceReady && options.packagedDistributionReady) {
      return CLI_ACP_HOST_RUNTIME_AND_DISTRIBUTION_READY_STATE_SUMMARY;
    }
    if (options.runtimeServiceReady) {
      return CLI_ACP_HOST_RUNTIME_SERVICE_READY_STATE_SUMMARY;
    }
    if (options.packagedDistributionReady) {
      return CLI_ACP_HOST_DISTRIBUTION_READY_STATE_SUMMARY;
    }
    return CLI_ACP_HOST_COMPANION_STATE_SUMMARY;
  }

  private resolveCleanRoomVerification(surface: AdapterSurface): boolean {
    const summaryPath = resolve(
      this.workspaceRoot,
      ...ACP_CLEAN_ROOM_VERIFICATION_SUMMARY_RELATIVE_PATH,
    );
    if (!existsSync(summaryPath)) {
      return false;
    }

    const summary = this.readJsonFile<CliAcpCleanRoomVerificationSummary>(summaryPath);
    if (
      !summary ||
      summary.schemaVersion !== ACP_CLEAN_ROOM_VERIFICATION_SUMMARY_SCHEMA_VERSION ||
      summary.overallStatus !== ACP_CLEAN_ROOM_VERIFICATION_REQUIRED_STATUS ||
      summary.distributionMode !== ACP_CLEAN_ROOM_VERIFICATION_REQUIRED_DISTRIBUTION_MODE ||
      !Array.isArray(summary.surfaces)
    ) {
      return false;
    }

    return summary.surfaces.some(
      (record) =>
        record.surfaceId === surface &&
        record.status === HostVerificationStatus.PASS &&
        this.hasRequiredCleanRoomModes(record.verifiedModes) &&
        this.hasRequiredCleanRoomReceipts(
          record.runtimeServiceVerificationSummaryPaths,
          summaryPath,
        ) &&
        this.hasRequiredCleanRoomReceipts(
          record.packagedDistributionVerificationSummaryPaths,
          summaryPath,
        ),
    );
  }

  private hasRequiredCleanRoomModes(verifiedModes: string[] | undefined): boolean {
    if (!Array.isArray(verifiedModes)) {
      return false;
    }

    const verifiedModeSet = new Set(verifiedModes);
    return ACP_CLEAN_ROOM_VERIFICATION_REQUIRED_MODES.every((mode) => verifiedModeSet.has(mode));
  }

  private hasRequiredCleanRoomReceipts(
    summaryPaths: string[] | undefined,
    summaryFilePath: string,
  ): boolean {
    if (!Array.isArray(summaryPaths)) {
      return false;
    }

    const uniqueSummaryPaths = Array.from(
      new Set(
        summaryPaths.filter(
          (summaryPath): summaryPath is string =>
            typeof summaryPath === 'string' && summaryPath.trim().length > 0,
        ),
      ),
    );
    if (uniqueSummaryPaths.length < ACP_CLEAN_ROOM_VERIFICATION_REQUIRED_MODES.length) {
      return false;
    }

    return uniqueSummaryPaths.every((summaryPath) => {
      const receiptSummaryPath = this.resolveTrackedCleanRoomReceiptPath(
        summaryFilePath,
        summaryPath,
      );
      if (!receiptSummaryPath) {
        return false;
      }
      const receiptSummary = this.readJsonFile<HostVerificationSummary>(receiptSummaryPath);
      return (
        receiptSummary?.schemaVersion === HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION &&
        receiptSummary.status === HostVerificationStatus.PASS
      );
    });
  }

  private resolveTrackedCleanRoomReceiptPath(
    summaryFilePath: string,
    summaryPath: string,
  ): string | null {
    const normalizedSummaryPath = summaryPath.trim();
    if (normalizedSummaryPath.length === 0 || isAbsolute(normalizedSummaryPath)) {
      return null;
    }

    const trackedReceiptRoot = resolve(
      dirname(summaryFilePath),
      ACP_CLEAN_ROOM_TRACKED_RECEIPTS_DIRECTORY,
    );
    const trackedReceiptPath = resolve(dirname(summaryFilePath), normalizedSummaryPath);
    const trackedReceiptRelativePath = relative(trackedReceiptRoot, trackedReceiptPath);
    if (
      trackedReceiptRelativePath.length === 0 ||
      trackedReceiptRelativePath.startsWith('..') ||
      isAbsolute(trackedReceiptRelativePath)
    ) {
      return null;
    }

    return trackedReceiptPath;
  }

  private readJsonFile<T>(filePath: string): T | null {
    try {
      return JSON.parse(readFileSync(filePath, 'utf8')) as T;
    } catch {
      return null;
    }
  }
}
