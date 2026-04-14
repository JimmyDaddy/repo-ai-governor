import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

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
  }): string {
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

  private readJsonFile<T>(filePath: string): T | null {
    try {
      return JSON.parse(readFileSync(filePath, 'utf8')) as T;
    } catch {
      return null;
    }
  }
}
