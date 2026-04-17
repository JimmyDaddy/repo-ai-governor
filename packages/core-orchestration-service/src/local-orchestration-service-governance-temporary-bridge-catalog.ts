import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  OrchestrationGovernanceTemporaryBridgeBacklinkSurface,
  OrchestrationGovernanceTemporaryBridgeCapabilityClass,
  type OrchestrationGovernanceTemporaryBridgeEntry,
  OrchestrationGovernanceTemporaryBridgeExitCriterion,
  OrchestrationGovernanceTemporaryBridgeReceiptKind,
} from '@repo-ai-governor/orchestration-service-client';

interface LocalOrchestrationServiceGovernanceTemporaryBridgeCatalogDependencies {
  workspaceRoot: string;
  repositoryRoot?: string;
}

const SHELL_SAFE_ARGUMENT_PATTERN = /^[A-Za-z0-9_./,:=@%+-]+$/u;
const UPGRADE_REPORT_FILE_PATTERN = /^upgrade-(\d+)\.report\.json$/u;

/**
 * Owns the temporary CLI-bridge inventory projected into governed workbench consumers.
 *
 * Why this exists:
 * Phase B keeps high-value adoption and host operations on typed CLI bridges, but the bridge
 * inventory still needs one orchestration-owned contract for receipt visibility and exit criteria.
 */
export class LocalOrchestrationServiceGovernanceTemporaryBridgeCatalog {
  public constructor(
    private readonly dependencies: LocalOrchestrationServiceGovernanceTemporaryBridgeCatalogDependencies,
  ) {}

  /**
   * Lists every temporary bridge that VS Code and future workbench surfaces may present.
   * @returns Frozen bridge metadata owned by the local orchestration service.
   */
  public list(): OrchestrationGovernanceTemporaryBridgeEntry[] {
    const governanceWorkspaceRoot = this.resolveGovernanceWorkspaceRoot();
    const repositoryRoot = this.resolveRepositoryRoot();
    if (!repositoryRoot) {
      // Temporary bridge DTOs must fail closed until host surfaces pass the explicit repo root
      // fact, otherwise preview commands advertise unusable `--repo` and cwd values.
      return [];
    }

    const upgradeReportPath = this.resolveLatestUpgradeReportPath(governanceWorkspaceRoot);
    const bridgeEntries: OrchestrationGovernanceTemporaryBridgeEntry[] = [
      this.createBridgeEntry({
        bridgeId: 'temporary-bridge-adopt-bootstrap',
        capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.ADOPT_BOOTSTRAP,
        previewCommandLine: this.buildPreviewCommandLine([
          'repo-ai-governor',
          'adopt',
          'bootstrap',
          'adopter-complete',
          '--repo',
          repositoryRoot,
          '--hosts',
          'codex,claude-code',
        ]),
        commandWorkingDirectory: repositoryRoot,
        governanceWorkspaceRoot,
        receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.ADOPTION_INSTALL_RECEIPT,
        exitCriteria: [
          OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_ADOPTION_QUERY,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.ARTIFACT_BACKLINK_PROJECTED,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.COMMAND_SEAM_REPLACES_BRIDGE,
        ],
      }),
      this.createBridgeEntry({
        bridgeId: 'temporary-bridge-adoption-apply',
        capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.ADOPTION_APPLY,
        previewCommandLine: this.buildPreviewCommandLine([
          'repo-ai-governor',
          'adopt',
          'apply',
          'adopter-complete',
          '--repo',
          repositoryRoot,
          '--hosts',
          'codex,claude-code,github-copilot',
        ]),
        commandWorkingDirectory: repositoryRoot,
        governanceWorkspaceRoot,
        receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.ADOPTION_INSTALL_RECEIPT,
        exitCriteria: [
          OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_ADOPTION_QUERY,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.ARTIFACT_BACKLINK_PROJECTED,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.COMMAND_SEAM_REPLACES_BRIDGE,
        ],
      }),
      this.createBridgeEntry({
        bridgeId: 'temporary-bridge-host-export',
        capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_EXPORT,
        previewCommandLine: this.buildPreviewCommandLine([
          'repo-ai-governor',
          'host',
          'export',
          '--host',
          'codex',
          '--mode',
          'project-local',
          '--output-dir',
          resolve(governanceWorkspaceRoot, 'generated', 'hosts', 'codex'),
        ]),
        commandWorkingDirectory: repositoryRoot,
        governanceWorkspaceRoot,
        receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_EXPORT_RECEIPT,
        exitCriteria: [
          OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_HOST_QUERY,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.ARTIFACT_BACKLINK_PROJECTED,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.COMMAND_SEAM_REPLACES_BRIDGE,
        ],
      }),
      this.createBridgeEntry({
        bridgeId: 'temporary-bridge-host-verify',
        capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_VERIFY,
        previewCommandLine: this.buildPreviewCommandLine([
          'repo-ai-governor',
          'host',
          'verify',
          '--output-dir',
          resolve(governanceWorkspaceRoot, 'generated', 'hosts', 'github-copilot'),
        ]),
        commandWorkingDirectory: repositoryRoot,
        governanceWorkspaceRoot,
        receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_VERIFY_RECEIPT,
        exitCriteria: [
          OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_HOST_QUERY,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.ARTIFACT_BACKLINK_PROJECTED,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.COMMAND_SEAM_REPLACES_BRIDGE,
        ],
      }),
      this.createBridgeEntry({
        bridgeId: 'temporary-bridge-host-pack',
        capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_PACK,
        previewCommandLine: this.buildPreviewCommandLine([
          'repo-ai-governor',
          'host',
          'pack',
          '--host',
          'claude-code',
          '--mode',
          'plugin-bundle',
          '--bundle-dir',
          resolve(governanceWorkspaceRoot, 'generated', 'bundles', 'claude'),
        ]),
        commandWorkingDirectory: repositoryRoot,
        governanceWorkspaceRoot,
        receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_PACK_RECEIPT,
        exitCriteria: [
          OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_HOST_QUERY,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.ARTIFACT_BACKLINK_PROJECTED,
          OrchestrationGovernanceTemporaryBridgeExitCriterion.COMMAND_SEAM_REPLACES_BRIDGE,
        ],
      }),
    ];

    if (upgradeReportPath) {
      bridgeEntries.push(
        this.createBridgeEntry({
          bridgeId: 'temporary-bridge-upgrade',
          capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.UPGRADE,
          previewCommandLine: this.buildPreviewCommandLine([
            'repo-ai-governor',
            'upgrade',
            'apply',
            upgradeReportPath,
            '--confirm-upgrade',
            'approve',
            '--output',
            'pretty',
          ]),
          commandWorkingDirectory: repositoryRoot,
          governanceWorkspaceRoot,
          receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.UPGRADE_APPLY_RECEIPT,
          exitCriteria: [
            OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_UPGRADE_QUERY,
            OrchestrationGovernanceTemporaryBridgeExitCriterion.ARTIFACT_BACKLINK_PROJECTED,
            OrchestrationGovernanceTemporaryBridgeExitCriterion.COMMAND_SEAM_REPLACES_BRIDGE,
          ],
        }),
      );
    }

    return bridgeEntries;
  }

  private createBridgeEntry(options: {
    bridgeId: string;
    capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass;
    commandWorkingDirectory: string;
    governanceWorkspaceRoot: string;
    previewCommandLine: string;
    receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind;
    exitCriteria: OrchestrationGovernanceTemporaryBridgeExitCriterion[];
  }): OrchestrationGovernanceTemporaryBridgeEntry {
    return {
      bridgeId: options.bridgeId,
      capabilityClass: options.capabilityClass,
      workspaceRoot: options.governanceWorkspaceRoot,
      commandWorkingDirectory: options.commandWorkingDirectory,
      previewCommandLine: options.previewCommandLine,
      receiptKind: options.receiptKind,
      backlinkSurface: OrchestrationGovernanceTemporaryBridgeBacklinkSurface.ARTIFACT_WORKBENCH,
      exitCriteria: [...options.exitCriteria],
    };
  }

  private resolveGovernanceWorkspaceRoot(): string {
    return resolve(this.dependencies.workspaceRoot);
  }

  private resolveRepositoryRoot(): string | undefined {
    return this.dependencies.repositoryRoot ? resolve(this.dependencies.repositoryRoot) : undefined;
  }

  private resolveLatestUpgradeReportPath(governanceWorkspaceRoot: string): string | undefined {
    const upgradeDirectoryPath = resolve(governanceWorkspaceRoot, 'context', 'upgrade');
    if (!existsSync(upgradeDirectoryPath)) {
      return undefined;
    }

    const latestReportFileName = readdirSync(upgradeDirectoryPath)
      .map((fileName) => ({
        fileName,
        matchedReport: fileName.match(UPGRADE_REPORT_FILE_PATTERN),
      }))
      .filter(
        (
          entry,
        ): entry is {
          fileName: string;
          matchedReport: RegExpMatchArray;
        } => entry.matchedReport !== null,
      )
      .sort(
        (left, right) =>
          Number(right.matchedReport[1] ?? '0') - Number(left.matchedReport[1] ?? '0'),
      )[0]?.fileName;

    return latestReportFileName ? resolve(upgradeDirectoryPath, latestReportFileName) : undefined;
  }

  private buildPreviewCommandLine(commandArguments: string[]): string {
    return commandArguments.map((argument) => this.quoteShellArgument(argument)).join(' ');
  }

  private quoteShellArgument(argument: string): string {
    if (argument.length === 0) {
      return "''";
    }

    if (SHELL_SAFE_ARGUMENT_PATTERN.test(argument)) {
      return argument;
    }

    return `'${argument.replace(/'/gu, `'\\''`)}'`;
  }
}
