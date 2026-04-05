import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { ClaudeCodeHostRenderer } from '@repo-ai-governor/adapter-claude-code';
import { CodexHostRenderer } from '@repo-ai-governor/adapter-codex';
import { GithubCopilotHostRenderer } from '@repo-ai-governor/adapter-github-copilot';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  HOST_EXPORT_MANIFEST_SCHEMA_VERSION,
  HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION,
  HostDistributionHandoffBridge,
  HostDistributionHost,
  HostDistributionMode,
  HostDistributionTarget,
  type HostExportManifest,
  type HostExportProjectedFile,
  type HostPackReport,
  type HostRendererRenderResult,
  type HostTargetCapabilities,
  type HostVerificationCheck,
  HostVerificationStatus,
  type HostVerificationSummary,
  type StructuredWorkflowAssetRecord,
  StructuredWorkflowAssetRegistry,
} from '@repo-ai-governor/standards';
import { CliGithubCopilotTargetOption, CliHostAction } from '../constants/cli-host.constant.js';
import type { CliHostCommandOptions } from '../types/interfaces/cli-host-command.interface.js';

type HostDistributionTextLocalizer = (english: string, chinese: string) => string;

interface HostDistributionOperationResult {
  action: CliHostAction;
  host: HostDistributionHost;
  mode: HostDistributionMode;
  target: HostDistributionTarget;
  stagedExportRoot: string;
  exportManifestPath: string;
  verificationSummaryPath: string;
  verificationStatus: HostVerificationStatus;
  workflowIds: string[];
  checks: HostVerificationCheck[];
  writtenArtifacts: string[];
  applyReportPath?: string;
  packReportPath?: string;
  applyRoot?: string;
  bundleRoot?: string;
}

/**
 * Owns host-distribution workflow discovery plus staged export/apply/pack/verify orchestration.
 */
export class CliHostDistributionRuntime {
  public constructor(
    private readonly currentWorkingDirectory: string,
    private readonly localizeText: HostDistributionTextLocalizer = (english) => english,
  ) {}

  /**
   * Renders a staged export tree and optionally applies project-local assets into a repository.
   * @param options Parsed host command options.
   * @returns Export receipt metadata and verification checks.
   */
  public async export(options: CliHostCommandOptions): Promise<HostDistributionOperationResult> {
    const host = this.requireHost(options);
    const mode = this.requireMode(options);
    const target = this.resolveTarget(options, host, mode);
    const targetCapabilities = new StructuredWorkflowAssetRegistry().describeTargetCapabilities(
      target,
    );
    const stagedExportRoot = this.resolveStagedExportRoot(host, options.outputDir);
    const exportManifestPath = resolve(stagedExportRoot, 'host-export.manifest.json');
    const verificationSummaryPath = resolve(stagedExportRoot, 'host-verification.summary.json');
    const applyRoot =
      mode === HostDistributionMode.PROJECT_LOCAL && options.applyToRepo
        ? resolve(this.currentWorkingDirectory, options.applyToRepo)
        : undefined;
    const applyReportPath = applyRoot
      ? resolve(stagedExportRoot, 'host-apply.report.json')
      : undefined;
    this.assertSupportedMode(CliHostAction.EXPORT, target, mode, targetCapabilities);
    this.assertApplySupported(target, applyRoot, targetCapabilities);
    const registry = await this.buildRegistry();
    const rendered = this.resolveRenderer(host, registry).render({
      host,
      mode,
      target,
      stagedExportRoot,
      exportManifestPath,
      verificationSummaryPath,
      ...(applyRoot && applyReportPath
        ? {
            applyRoot,
            applyReportPath,
          }
        : {}),
      ...(options.handoffBridge
        ? {
            handoffBridge: options.handoffBridge,
          }
        : {}),
      ...(options.workflowIds.length > 0
        ? {
            workflowIds: options.workflowIds,
          }
        : {}),
      canonicalSourceRefs: existsSync(resolve(this.currentWorkingDirectory, 'AGENTS.md'))
        ? ['AGENTS.md']
        : [],
    });
    const writtenArtifacts = await this.writeRenderedArtifacts(rendered, stagedExportRoot);

    if (applyRoot) {
      await this.writeProjectedFiles(applyRoot, rendered.projectedFiles);
      if (rendered.applyReport && applyReportPath) {
        await this.writeJsonArtifact(applyReportPath, rendered.applyReport);
      }
    }

    return {
      action: CliHostAction.EXPORT,
      host,
      mode,
      target,
      stagedExportRoot,
      exportManifestPath,
      verificationSummaryPath,
      verificationStatus: rendered.verificationSummary.status,
      workflowIds: rendered.exportManifest.workflowIds,
      checks: rendered.verificationSummary.checks,
      writtenArtifacts: [
        ...writtenArtifacts,
        ...(applyRoot && applyReportPath ? [applyReportPath] : []),
      ],
      ...(applyReportPath ? { applyReportPath } : {}),
      ...(applyRoot ? { applyRoot } : {}),
    };
  }

  /**
   * Renders a staged plugin export tree and materializes the installable bundle directory.
   * @param options Parsed host command options.
   * @returns Pack receipt metadata and verification checks.
   */
  public async pack(options: CliHostCommandOptions): Promise<HostDistributionOperationResult> {
    const host = this.requireHost(options);
    const mode = options.mode ?? HostDistributionMode.PLUGIN_BUNDLE;
    const target = this.resolveTarget(options, host, mode);
    const targetCapabilities = new StructuredWorkflowAssetRegistry().describeTargetCapabilities(
      target,
    );
    const stagedExportRoot = this.resolveStagedExportRoot(host, options.outputDir);
    const bundleRoot = this.resolveBundleRoot(target, options.bundleDir);
    const exportManifestPath = resolve(stagedExportRoot, 'host-export.manifest.json');
    const verificationSummaryPath = resolve(stagedExportRoot, 'host-verification.summary.json');
    const packReportPath = resolve(stagedExportRoot, 'host-pack.report.json');
    this.assertSupportedMode(CliHostAction.PACK, target, mode, targetCapabilities);
    this.assertBundleSupported(target, bundleRoot, targetCapabilities);
    const registry = await this.buildRegistry();
    const rendered = this.resolveRenderer(host, registry).render({
      host,
      mode,
      target,
      stagedExportRoot,
      exportManifestPath,
      verificationSummaryPath,
      bundleRoot,
      packReportPath,
      ...(options.handoffBridge
        ? {
            handoffBridge: options.handoffBridge,
          }
        : {}),
      ...(options.workflowIds.length > 0
        ? {
            workflowIds: options.workflowIds,
          }
        : {}),
      canonicalSourceRefs: existsSync(resolve(this.currentWorkingDirectory, 'AGENTS.md'))
        ? ['AGENTS.md']
        : [],
    });
    const writtenArtifacts = await this.writeRenderedArtifacts(rendered, stagedExportRoot);
    await this.writeProjectedFiles(bundleRoot, rendered.projectedFiles);
    if (rendered.packReport) {
      await this.writeJsonArtifact(packReportPath, rendered.packReport);
    }

    return {
      action: CliHostAction.PACK,
      host,
      mode,
      target,
      stagedExportRoot,
      exportManifestPath,
      verificationSummaryPath,
      verificationStatus: rendered.verificationSummary.status,
      workflowIds: rendered.exportManifest.workflowIds,
      checks: rendered.verificationSummary.checks,
      writtenArtifacts: [...writtenArtifacts, packReportPath],
      packReportPath,
      bundleRoot,
    };
  }

  /**
   * Verifies the staged export tree and any applied/bundled materialized assets referenced by the manifest.
   * @param options Parsed host command options.
   * @returns Verification receipt metadata plus concrete pass/warn/fail checks.
   */
  public async verify(options: CliHostCommandOptions): Promise<HostDistributionOperationResult> {
    const manifestPath = this.resolveManifestPath(options);
    const manifest = await this.readJsonArtifact<HostExportManifest>(manifestPath);
    const stagedExportRoot = manifest.stagedExportRoot;
    const checks: HostVerificationCheck[] = [];
    const targetCapabilities = new StructuredWorkflowAssetRegistry().describeTargetCapabilities(
      manifest.target,
    );

    checks.push(
      this.createCheck(
        'schema-version',
        manifest.schemaVersion === HOST_EXPORT_MANIFEST_SCHEMA_VERSION,
        `schema_version=${manifest.schemaVersion}`,
        manifestPath,
        HOST_EXPORT_MANIFEST_SCHEMA_VERSION,
        manifest.schemaVersion,
      ),
    );
    checks.push(
      this.createCheck(
        'canonical-source-refs',
        await this.checkCanonicalSourceRefs(manifest.canonicalSourceRefs),
        `canonical_source_refs=${manifest.canonicalSourceRefs.length}`,
        manifestPath,
        'all canonical source refs exist',
        String(manifest.canonicalSourceRefs.length),
      ),
    );
    checks.push(
      this.createCheck(
        'target-capability',
        targetCapabilities.isMvpTarget,
        `mvp_target=${String(targetCapabilities.isMvpTarget)}`,
        manifestPath,
        'true',
        String(targetCapabilities.isMvpTarget),
      ),
    );
    checks.push(
      this.createCheck(
        'deprecated-github-app-path',
        !manifest.projectedFiles.some((file) => file.relativePath.includes('copilot-extension')),
        'github_app_copilot_extension_path_blocked=true',
        manifestPath,
        'no deprecated GitHub App Copilot Extension path',
        'deprecated path absent',
      ),
    );
    checks.push(
      this.createCheck(
        'required-target-paths',
        this.hasRequiredTargetPaths(manifest),
        `required_paths_checked=${manifest.target}`,
        manifestPath,
        'required paths present',
        manifest.target,
      ),
    );

    for (const projectedFile of manifest.projectedFiles) {
      const stagedFilePath = resolve(stagedExportRoot, projectedFile.relativePath);
      const stagedContent = existsSync(stagedFilePath)
        ? await readFile(stagedFilePath, 'utf8')
        : null;
      checks.push(
        this.createCheck(
          `staged:${projectedFile.relativePath}`,
          stagedContent === projectedFile.content,
          `staged_file=${projectedFile.relativePath}`,
          stagedFilePath,
          'staged file content matches manifest',
          stagedContent === null ? 'missing' : 'present',
        ),
      );
    }

    if (manifest.applyReportPath) {
      const applyReportExists = existsSync(manifest.applyReportPath);
      checks.push(
        this.createCheck(
          'apply-report-presence',
          applyReportExists,
          `apply_report=${manifest.applyReportPath}`,
          manifest.applyReportPath,
          'apply report exists when manifest declares apply report path',
          applyReportExists ? 'present' : 'missing',
        ),
      );
    }

    if (manifest.applyReportPath && existsSync(manifest.applyReportPath)) {
      const applyReport = await this.readJsonArtifact<{ applyRoot: string }>(
        manifest.applyReportPath,
      );
      for (const projectedFile of manifest.projectedFiles) {
        const appliedFilePath = resolve(applyReport.applyRoot, projectedFile.relativePath);
        const appliedContent = existsSync(appliedFilePath)
          ? await readFile(appliedFilePath, 'utf8')
          : null;
        checks.push(
          this.createCheck(
            `applied:${projectedFile.relativePath}`,
            appliedContent === projectedFile.content,
            `applied_file=${projectedFile.relativePath}`,
            appliedFilePath,
            'applied file content matches staged export',
            appliedContent === null ? 'missing' : 'present',
          ),
        );
      }
    }

    if (manifest.packReportPath) {
      const packReportExists = existsSync(manifest.packReportPath);
      checks.push(
        this.createCheck(
          'pack-report-presence',
          packReportExists,
          `pack_report=${manifest.packReportPath}`,
          manifest.packReportPath,
          'pack report exists when manifest declares pack report path',
          packReportExists ? 'present' : 'missing',
        ),
      );
    }

    if (manifest.packReportPath && existsSync(manifest.packReportPath)) {
      const packReport = await this.readJsonArtifact<HostPackReport>(manifest.packReportPath);
      for (const projectedFile of manifest.projectedFiles) {
        const packedFilePath = resolve(packReport.bundleRoot, projectedFile.relativePath);
        const packedContent = existsSync(packedFilePath)
          ? await readFile(packedFilePath, 'utf8')
          : null;
        checks.push(
          this.createCheck(
            `packed:${projectedFile.relativePath}`,
            packedContent === projectedFile.content,
            `packed_file=${projectedFile.relativePath}`,
            packedFilePath,
            'packed file content matches staged export',
            packedContent === null ? 'missing' : 'present',
          ),
        );
      }
    }

    const verificationSummaryPath =
      manifest.verificationSummary.verificationSummaryPath ||
      resolve(stagedExportRoot, 'host-verification.summary.json');
    const verificationSummary: HostVerificationSummary = {
      schemaVersion: HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION,
      status: this.reduceVerificationStatus(checks),
      verifiedAt: new Date().toISOString(),
      verificationSummaryPath,
      exportManifestPath: manifest.exportManifestPath,
      checks,
      inspectedPaths: manifest.projectedFiles.map((file) => file.relativePath),
      driftDetected: checks.some((check) => check.status === HostVerificationStatus.FAIL),
    };
    await this.writeJsonArtifact(verificationSummaryPath, verificationSummary);

    return {
      action: CliHostAction.VERIFY,
      host: manifest.host,
      mode: manifest.mode,
      target: manifest.target,
      stagedExportRoot,
      exportManifestPath: manifest.exportManifestPath,
      verificationSummaryPath,
      verificationStatus: verificationSummary.status,
      workflowIds: manifest.workflowIds,
      checks,
      writtenArtifacts: [verificationSummaryPath],
      ...(manifest.applyReportPath ? { applyReportPath: manifest.applyReportPath } : {}),
      ...(manifest.packReportPath ? { packReportPath: manifest.packReportPath } : {}),
    };
  }

  private async buildRegistry(): Promise<StructuredWorkflowAssetRegistry> {
    return new StructuredWorkflowAssetRegistry({
      records: await this.discoverWorkflowRecords(),
    });
  }

  private async discoverWorkflowRecords(): Promise<StructuredWorkflowAssetRecord[]> {
    const skillsRoot = resolve(this.currentWorkingDirectory, '.codex', 'skills');
    if (!existsSync(skillsRoot)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          'Host distribution requires repository-local skills under .codex/skills.',
          'Host distribution 需要 .codex/skills 下的仓库本地 skills。',
        ),
        {
          skillsRoot,
        },
      );
    }

    const entries = await readdir(skillsRoot, { withFileTypes: true });
    const records: StructuredWorkflowAssetRecord[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue;
      }

      const skillRelativePath = ['.codex', 'skills', entry.name, 'SKILL.md'].join('/');
      const skillAbsolutePath = resolve(this.currentWorkingDirectory, skillRelativePath);
      if (!existsSync(skillAbsolutePath) || !(await stat(skillAbsolutePath)).isFile()) {
        continue;
      }

      const skillContent = await readFile(skillAbsolutePath, 'utf8');
      const frontmatter = this.parseSkillFrontmatter(skillContent);
      const workflowId = (frontmatter.name ?? entry.name).trim();
      records.push({
        workflowId,
        workflowVersion: 'repo-local',
        workflowStatus: 'active',
        semanticOwnerModule: 'runtime.governance-clients',
        displayName: this.toDisplayName(workflowId),
        description:
          frontmatter.description?.trim() ?? `${this.toDisplayName(workflowId)} host projection.`,
        canonicalSourceRefs: [skillRelativePath],
        sourcePackRefs: [`repo-local-skill:${workflowId}`],
        hostTargetMatrix: [
          HostDistributionTarget.CODEX_PROJECT_LOCAL,
          HostDistributionTarget.CODEX_PLUGIN,
          HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL,
          HostDistributionTarget.CLAUDE_CODE_PLUGIN,
          HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL,
          HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN,
          HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT,
        ],
        triggerHints: workflowId.split('-'),
        inputs: ['host_distribution'],
        artifacts: ['host_projection'],
        riskTier: workflowId.includes('delivery') ? 'high' : 'medium',
        handoffBridge: HostDistributionHandoffBridge.CLI_WRAPPER,
        handoffTarget: `repo-ai-governor ${workflowId}`,
        verificationProfileRefs: ['host.verify'],
        driftChecks: ['canonical_source_refs', 'staged_to_applied_drift'],
      });
    }

    return records.sort((left, right) => left.workflowId.localeCompare(right.workflowId));
  }

  private parseSkillFrontmatter(content: string): {
    name?: string;
    description?: string;
  } {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return {};
    }

    const parsed: { name?: string; description?: string } = {};
    for (const line of frontmatterMatch[1].split('\n')) {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex < 0) {
        continue;
      }
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (key === 'name' || key === 'description') {
        parsed[key] = value;
      }
    }

    return parsed;
  }

  private toDisplayName(workflowId: string): string {
    return workflowId
      .split(/[-_]/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private resolveRenderer(host: HostDistributionHost, registry: StructuredWorkflowAssetRegistry) {
    switch (host) {
      case HostDistributionHost.CODEX:
        return new CodexHostRenderer({
          registry,
          currentWorkingDirectory: this.currentWorkingDirectory,
        });
      case HostDistributionHost.CLAUDE_CODE:
        return new ClaudeCodeHostRenderer({
          registry,
          currentWorkingDirectory: this.currentWorkingDirectory,
        });
      case HostDistributionHost.GITHUB_COPILOT:
        return new GithubCopilotHostRenderer({
          registry,
          currentWorkingDirectory: this.currentWorkingDirectory,
        });
      default:
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_PACK_INVALID,
          this.localizeText(`Unsupported host "${host}".`, `不支持的 host "${host}"。`),
          {
            host,
          },
        );
    }
  }

  private requireHost(options: CliHostCommandOptions): HostDistributionHost {
    if (!options.host) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.localizeText('Host command requires --host.', 'host 命令需要 --host。'),
      );
    }

    return options.host;
  }

  private requireMode(options: CliHostCommandOptions): HostDistributionMode {
    if (!options.mode) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.localizeText('Host command requires --mode.', 'host 命令需要 --mode。'),
      );
    }

    return options.mode;
  }

  private resolveTarget(
    options: CliHostCommandOptions,
    host: HostDistributionHost,
    mode: HostDistributionMode,
  ): HostDistributionTarget {
    if (options.target) {
      return options.target;
    }

    if (host === HostDistributionHost.GITHUB_COPILOT) {
      switch (options.githubCopilotTarget) {
        case CliGithubCopilotTargetOption.REPO_LOCAL:
          return HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL;
        case CliGithubCopilotTargetOption.CLI_PLUGIN:
          return HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN;
        case CliGithubCopilotTargetOption.GITHUB_COM_AGENT:
          return HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT;
        default:
          return mode === HostDistributionMode.PLUGIN_BUNDLE
            ? HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN
            : HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL;
      }
    }

    if (host === HostDistributionHost.CODEX) {
      return mode === HostDistributionMode.PLUGIN_BUNDLE
        ? HostDistributionTarget.CODEX_PLUGIN
        : HostDistributionTarget.CODEX_PROJECT_LOCAL;
    }

    return mode === HostDistributionMode.PLUGIN_BUNDLE
      ? HostDistributionTarget.CLAUDE_CODE_PLUGIN
      : HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL;
  }

  private resolveStagedExportRoot(host: HostDistributionHost, outputDir: string | null): string {
    if (outputDir) {
      return resolve(this.currentWorkingDirectory, outputDir);
    }

    return resolve(this.currentWorkingDirectory, '.repo-ai-governor', 'generated', 'hosts', host);
  }

  private resolveBundleRoot(target: HostDistributionTarget, bundleDir: string | null): string {
    if (bundleDir) {
      return resolve(this.currentWorkingDirectory, bundleDir);
    }

    return resolve(
      this.currentWorkingDirectory,
      '.repo-ai-governor',
      'generated',
      'bundles',
      target.replace(/\./g, '/'),
    );
  }

  private resolveManifestPath(options: CliHostCommandOptions): string {
    if (options.manifestPath) {
      return resolve(this.currentWorkingDirectory, options.manifestPath);
    }

    if (options.outputDir) {
      return resolve(this.currentWorkingDirectory, options.outputDir, 'host-export.manifest.json');
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.localizeText(
        'Host verify requires --manifest or --output-dir.',
        'host verify 需要 --manifest 或 --output-dir。',
      ),
    );
  }

  private assertSupportedMode(
    action: CliHostAction,
    target: HostDistributionTarget,
    mode: HostDistributionMode,
    targetCapabilities: HostTargetCapabilities,
  ): void {
    if (
      targetCapabilities.supportedModes.length > 0 &&
      !targetCapabilities.supportedModes.includes(mode)
    ) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          `Host ${action} target "${target}" does not support mode "${mode}".`,
          `host ${action} 的 target "${target}" 不支持 mode "${mode}"。`,
        ),
        {
          action,
          target,
          mode,
          supportedModes: targetCapabilities.supportedModes,
        },
      );
    }
  }

  private assertApplySupported(
    target: HostDistributionTarget,
    applyRoot: string | undefined,
    targetCapabilities: HostTargetCapabilities,
  ): void {
    if (applyRoot && !targetCapabilities.supportsApplyToRepo) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          `Host export target "${target}" does not support --apply-to-repo.`,
          `host export 的 target "${target}" 不支持 --apply-to-repo。`,
        ),
        {
          target,
          applyRoot,
        },
      );
    }
  }

  private assertBundleSupported(
    target: HostDistributionTarget,
    bundleRoot: string,
    targetCapabilities: HostTargetCapabilities,
  ): void {
    if (!targetCapabilities.supportsBundlePackaging) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          `Host pack target "${target}" does not support bundle packaging.`,
          `host pack 的 target "${target}" 不支持 bundle packaging。`,
        ),
        {
          target,
          bundleRoot,
        },
      );
    }
  }

  private async writeRenderedArtifacts(
    rendered: HostRendererRenderResult,
    stagedExportRoot: string,
  ): Promise<string[]> {
    const writtenFiles = await this.writeProjectedFiles(stagedExportRoot, rendered.projectedFiles);
    await this.writeJsonArtifact(
      rendered.exportManifest.exportManifestPath,
      rendered.exportManifest,
    );
    await this.writeJsonArtifact(
      rendered.verificationSummary.verificationSummaryPath,
      rendered.verificationSummary,
    );

    return [
      ...writtenFiles,
      rendered.exportManifest.exportManifestPath,
      rendered.verificationSummary.verificationSummaryPath,
    ];
  }

  private async writeProjectedFiles(
    root: string,
    files: readonly HostExportProjectedFile[],
  ): Promise<string[]> {
    const writtenFiles: string[] = [];
    for (const file of files) {
      const filePath = resolve(root, file.relativePath);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, file.content, 'utf8');
      writtenFiles.push(filePath);
    }

    return writtenFiles;
  }

  private async writeJsonArtifact(filePath: string, payload: unknown): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }

  private async readJsonArtifact<T>(filePath: string): Promise<T> {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  }

  private async checkCanonicalSourceRefs(canonicalSourceRefs: readonly string[]): Promise<boolean> {
    for (const sourceRef of canonicalSourceRefs) {
      const resolvedPath = resolve(this.currentWorkingDirectory, sourceRef);
      if (!existsSync(resolvedPath)) {
        return false;
      }
    }

    return true;
  }

  private hasRequiredTargetPaths(manifest: HostExportManifest): boolean {
    const requiredPaths = this.resolveRequiredTargetPaths(manifest.target);
    return requiredPaths.every((requiredPath) =>
      manifest.projectedFiles.some((file) =>
        requiredPath.endsWith('/')
          ? file.relativePath.startsWith(requiredPath)
          : file.relativePath === requiredPath,
      ),
    );
  }

  private resolveRequiredTargetPaths(target: HostDistributionTarget): string[] {
    switch (target) {
      case HostDistributionTarget.CODEX_PROJECT_LOCAL:
        return ['AGENTS.md', '.agents/skills/', '.mcp.json'];
      case HostDistributionTarget.CODEX_PLUGIN:
        return ['.codex-plugin/plugin.json', 'skills/', '.mcp.json'];
      case HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL:
        return ['.claude/skills/', '.claude/settings.json', '.claude/hooks/hooks.json'];
      case HostDistributionTarget.CLAUDE_CODE_PLUGIN:
        return ['.claude-plugin/plugin.json', 'skills/', 'hooks/hooks.json'];
      case HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL:
        return [
          'AGENTS.md',
          '.github/copilot-instructions.md',
          '.github/instructions/',
          '.github/skills/',
          '.github/agents/',
        ];
      case HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN:
        return ['plugin.json', 'skills/', 'agents/', 'hooks/hooks.json'];
      case HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT:
        return ['.github/copilot-instructions.md', '.github/agents/', '.github/mcp.json'];
      default:
        return [];
    }
  }

  private createCheck(
    checkId: string,
    passes: boolean,
    detail: string,
    inspectedPath: string,
    expectedValue: string,
    actualValue: string,
    failStatus: HostVerificationStatus = HostVerificationStatus.FAIL,
  ): HostVerificationCheck {
    return {
      checkId,
      status: passes ? HostVerificationStatus.PASS : failStatus,
      detail,
      inspectedPath,
      expectedValue,
      actualValue,
    };
  }

  private reduceVerificationStatus(
    checks: readonly HostVerificationCheck[],
  ): HostVerificationStatus {
    if (checks.some((check) => check.status === HostVerificationStatus.FAIL)) {
      return HostVerificationStatus.FAIL;
    }

    if (checks.some((check) => check.status === HostVerificationStatus.WARN)) {
      return HostVerificationStatus.WARN;
    }

    return HostVerificationStatus.PASS;
  }
}
