import {
  type OrchestrationSessionEvent,
  OrchestrationSessionEventType,
  OrchestrationSessionTranscriptRole,
} from '@repo-ai-governor/orchestration-service-client';
import { CliSessionTranscriptRole } from '../../constants/cli-session-shell.constant.js';
import type {
  CliSessionShellTranscriptBacklink,
  CliSessionShellTranscriptDetailsBlock,
  CliSessionShellTranscriptItem,
} from '../../types/index.js';

/**
 * Owns the presenter-side transcript cache derived from service-backed session events.
 *
 * Why this exists:
 * the CLI should render incremental event deltas without becoming the canonical owner of the
 * session transcript or cursor state.
 */
export class CliSessionShellTranscriptStore {
  private currentSessionId: string | null = null;
  private latestSequence = 0;
  private nextCursor: string | null = null;
  private readonly transcriptItems: CliSessionShellTranscriptItem[] = [];

  /**
   * Resets local presenter state before hydrating a new canonical session stream.
   * @param sessionId Canonical session id.
   * @returns Nothing.
   */
  public reset(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.latestSequence = 0;
    this.nextCursor = null;
    this.transcriptItems.splice(0, this.transcriptItems.length);
  }

  /**
   * Applies incremental service events and appends newly-renderable transcript items only once.
   * @param sessionId Canonical session id.
   * @param events Incremental session events.
   * @param translate CLI i18n translation function.
   * @returns Cloned transcript items after the delta is applied.
   */
  public applyEvents(
    sessionId: string,
    events: OrchestrationSessionEvent[],
    translate: (key: string, interpolation?: Record<string, string>) => string,
    resolveTurnDetails?: (turnId: string) => string[],
  ): CliSessionShellTranscriptItem[] {
    if (this.currentSessionId !== sessionId) {
      this.reset(sessionId);
    }

    for (const event of events) {
      if (event.sequence <= this.latestSequence) {
        continue;
      }

      const transcriptItem = this.mapEventToTranscriptItem(event, translate, resolveTurnDetails);
      if (transcriptItem) {
        this.transcriptItems.push(transcriptItem);
      }
      this.latestSequence = event.sequence;
      this.nextCursor = event.streamCursor;
    }

    return this.listItems();
  }

  /**
   * Returns the current subscribe cursor for the presenter's incremental stream sync.
   * @returns Next cursor or `null` before the first sync completes.
   */
  public getNextCursor(): string | null {
    return this.nextCursor;
  }

  /**
   * Clears the current presenter transcript view while keeping the canonical session cursor intact.
   * @returns Nothing.
   */
  public clearView(): void {
    this.transcriptItems.splice(0, this.transcriptItems.length);
  }

  /**
   * Returns cloned transcript items so callers do not mutate store-owned state.
   * @returns Current transcript snapshot.
   */
  public listItems(): CliSessionShellTranscriptItem[] {
    return this.transcriptItems.map((item) => ({
      ...item,
      lines: [...item.lines],
      ...(item.referencedCapabilityIds
        ? { referencedCapabilityIds: [...item.referencedCapabilityIds] }
        : {}),
      ...(item.backlinks ? { backlinks: item.backlinks.map((backlink) => ({ ...backlink })) } : {}),
      ...(item.details
        ? {
            details: {
              ...item.details,
              lines: [...item.details.lines],
            },
          }
        : {}),
      ...(item.suggestedActionsBlock
        ? {
            suggestedActionsBlock: {
              ...item.suggestedActionsBlock,
              actions: item.suggestedActionsBlock.actions.map((action) => ({
                ...action,
              })),
            },
          }
        : {}),
      ...(item.providerContinuationBlock
        ? {
            providerContinuationBlock: {
              ...item.providerContinuationBlock,
              lines: [...item.providerContinuationBlock.lines],
            },
          }
        : {}),
    }));
  }

  /**
   * Toggles the newest transcript execution-details block in-place.
   * @param translate CLI i18n translation function.
   * @returns `true` when one item was toggled.
   */
  public toggleLatestExecutionDetails(
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): boolean {
    for (let index = this.transcriptItems.length - 1; index >= 0; index -= 1) {
      const item = this.transcriptItems[index];
      if (!item?.details) {
        continue;
      }

      item.details.expanded = !item.details.expanded;
      item.details.summaryLine = this.renderExecutionDetailsSummaryLine(item.details, translate);
      return true;
    }

    return false;
  }

  private mapEventToTranscriptItem(
    event: OrchestrationSessionEvent,
    translate: (key: string, interpolation?: Record<string, string>) => string,
    resolveTurnDetails?: (turnId: string) => string[],
  ): CliSessionShellTranscriptItem | null {
    const role = event.payload.role;
    if (
      role !== OrchestrationSessionTranscriptRole.SYSTEM &&
      role !== OrchestrationSessionTranscriptRole.USER &&
      role !== OrchestrationSessionTranscriptRole.ASSISTANT &&
      role !== OrchestrationSessionTranscriptRole.SLASH_COMMAND
    ) {
      return null;
    }

    if (event.type === OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED) {
      const lines = this.readStringArray(event.payload.lines);
      if (lines.length === 0) {
        return null;
      }
      const requestedRenderKind = this.readTranscriptRenderKind(event.payload.metadata);
      const metadata =
        event.payload.metadata && typeof event.payload.metadata === 'object'
          ? (event.payload.metadata as Record<string, unknown>)
          : null;
      const details = this.buildExecutionDetailsBlock(
        this.readStringArray(metadata?.executionDetailsLines),
        translate,
      );

      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: this.mapTranscriptRole(role),
        label: this.resolveTranscriptLabel(role, translate),
        lines,
        renderKind:
          requestedRenderKind ??
          (role === OrchestrationSessionTranscriptRole.SYSTEM ? 'system_notice' : 'plain_text'),
        ...(details ? { details } : {}),
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_SUBMITTED) {
      const content = this.readOptionalString(event.payload.content);
      if (!content) {
        return null;
      }

      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.USER,
        label: translate('cli.sessionShell.transcript.userLabel'),
        lines: [content],
        renderKind: 'plain_text',
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_COMPLETED) {
      const turnId = this.readOptionalString(event.payload.turnId);
      const payloadExecutionDetailsLines = this.readStringArray(
        event.payload.executionDetailsLines,
      );
      const details = this.buildExecutionDetailsBlock(
        this.mergeExecutionDetailsLines(
          payloadExecutionDetailsLines,
          turnId ? (resolveTurnDetails?.(turnId) ?? []) : [],
        ),
        translate,
      );
      const routeId = this.readOptionalString(event.payload.routeId) ?? 'session.main';
      const turnIndex = this.readOptionalNumber(event.payload.turnIndex);
      const assistantMessage = this.readOptionalString(event.payload.assistantMessage);
      const suggestedSlashCommand = this.readOptionalString(event.payload.suggestedSlashCommand);
      const executionIntent = this.readOptionalString(event.payload.executionIntent);
      const followUpQuestion = this.readOptionalString(event.payload.followUpQuestion);
      const handoffCommandPreview = this.readOptionalString(event.payload.handoffCommandPreview);
      const latestUserMessage = this.readOptionalString(event.payload.latestUserMessage);
      const responseMode = this.readOptionalString(event.payload.responseMode);
      const interactionMode = this.readOptionalString(event.payload.interactionMode);
      const handoffExecutionMode = this.readOptionalString(event.payload.handoffExecutionMode);
      const capabilityAnswerKind = this.readOptionalCapabilityAnswerKind(
        event.payload.capabilityAnswerKind,
      );
      const referencedCapabilityIds = this.readReferencedCapabilityIds(
        event.payload.referencedCapabilityIds,
      );
      const suggestedActionsBlock = this.buildSuggestedActionsBlock(
        event.payload.suggestedActions,
        translate,
      );
      const providerContinuationBlock = this.buildProviderContinuationBlock(
        event.payload.providerContinuationSummaries,
        translate,
      );
      const selectedSurface = this.readOptionalString(event.payload.selectedSurface);
      const selectedBy = this.readOptionalString(event.payload.selectedBy);
      const synthesisMode = this.readOptionalString(event.payload.synthesisMode);
      const invokedRoleIds = this.readStringArray(event.payload.invokedRoleIds);
      const subagentCount = this.readOptionalNumber(event.payload.subagentCount);
      const handoffBacklinks = this.readBacklinks(event.payload.handoffBacklinks);
      if (assistantMessage && responseMode === 'role_collaboration') {
        return {
          id: `${event.sessionId}:${String(event.sequence)}`,
          role: CliSessionTranscriptRole.ASSISTANT,
          label: translate('cli.sessionShell.transcript.assistantLabel'),
          lines: this.buildCollaborationRecapLines({
            interactionMode,
            invokedRoleIds,
            subagentCount,
            synthesisMode,
            selectedSurface,
            selectedBy,
            translate,
          }),
          renderKind: 'collaboration_recap',
          markdownSource: assistantMessage,
          ...(providerContinuationBlock ? { providerContinuationBlock } : {}),
          ...(details ? { details } : {}),
        };
      }

      if (assistantMessage && responseMode !== 'command_handoff_preview') {
        return {
          id: `${event.sessionId}:${String(event.sequence)}`,
          role: CliSessionTranscriptRole.ASSISTANT,
          label: translate('cli.sessionShell.transcript.assistantLabel'),
          lines: [assistantMessage],
          renderKind: 'markdown',
          markdownSource: assistantMessage,
          ...(capabilityAnswerKind ? { capabilityAnswerKind } : {}),
          ...(referencedCapabilityIds ? { referencedCapabilityIds } : {}),
          ...(suggestedActionsBlock ? { suggestedActionsBlock } : {}),
          ...(providerContinuationBlock ? { providerContinuationBlock } : {}),
          ...(details ? { details } : {}),
        };
      }

      if (responseMode === 'command_handoff_preview' && suggestedSlashCommand) {
        const executesImmediately = handoffExecutionMode === 'direct_execute';
        return {
          id: `${event.sessionId}:${String(event.sequence)}`,
          role: CliSessionTranscriptRole.ASSISTANT,
          label: translate('cli.sessionShell.transcript.assistantLabel'),
          lines: [
            translate(
              executesImmediately
                ? 'cli.sessionShell.responses.mainTurnAutoExecuteSlash'
                : 'cli.sessionShell.responses.mainTurnSuggestedSlash',
              {
                command: suggestedSlashCommand,
              },
            ),
            ...(handoffCommandPreview
              ? [
                  translate(
                    executesImmediately
                      ? 'cli.sessionShell.responses.mainTurnAutoExecuteCommand'
                      : 'cli.sessionShell.responses.mainTurnHandoffPreview',
                    {
                      preview: handoffCommandPreview,
                    },
                  ),
                ]
              : []),
            ...(executionIntent
              ? [
                  translate('cli.sessionShell.responses.mainTurnExecutionIntent', {
                    executionIntent,
                  }),
                ]
              : []),
            ...(selectedSurface && selectedBy
              ? [
                  translate('cli.sessionShell.responses.mainTurnRoutingSelection', {
                    selectedSurface,
                    selectedBy,
                  }),
                ]
              : []),
          ],
          renderKind: 'command_recap',
          ...(assistantMessage ? { markdownSource: assistantMessage } : {}),
          backlinks: handoffBacklinks,
          ...(providerContinuationBlock ? { providerContinuationBlock } : {}),
          ...(details ? { details } : {}),
        };
      }

      if (responseMode === 'follow_up_question' && followUpQuestion) {
        return {
          id: `${event.sessionId}:${String(event.sequence)}`,
          role: CliSessionTranscriptRole.ASSISTANT,
          label: translate('cli.sessionShell.transcript.assistantLabel'),
          lines: [
            translate('cli.sessionShell.responses.mainTurnFollowUpPrompt'),
            followUpQuestion,
            ...(selectedSurface && selectedBy
              ? [
                  translate('cli.sessionShell.responses.mainTurnRoutingSelection', {
                    selectedSurface,
                    selectedBy,
                  }),
                ]
              : []),
          ],
          renderKind: 'system_notice',
          backlinks: handoffBacklinks,
        };
      }

      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.ASSISTANT,
        label: translate('cli.sessionShell.transcript.assistantLabel'),
        lines: [
          translate('cli.sessionShell.responses.mainTurnAccepted', {
            routeId,
            turnIndex: String(turnIndex ?? event.sequence),
          }),
          ...(latestUserMessage
            ? [
                translate('cli.sessionShell.responses.mainTurnEcho', {
                  userMessage: latestUserMessage,
                }),
              ]
            : []),
          ...(executionIntent
            ? [
                translate('cli.sessionShell.responses.mainTurnExecutionIntent', {
                  executionIntent,
                }),
              ]
            : []),
          ...(selectedSurface && selectedBy
            ? [
                translate('cli.sessionShell.responses.mainTurnRoutingSelection', {
                  selectedSurface,
                  selectedBy,
                }),
              ]
            : []),
        ],
        renderKind: 'command_recap',
        backlinks: handoffBacklinks,
        ...(providerContinuationBlock ? { providerContinuationBlock } : {}),
        ...(details ? { details } : {}),
      };
    }

    if (event.type === OrchestrationSessionEventType.SESSION_RESUMED) {
      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.SYSTEM,
        label: translate('cli.sessionShell.transcript.systemLabel'),
        lines: [
          translate('cli.sessionShell.responses.sessionResumed', {
            sessionId: event.sessionId,
            resumeSelector: this.readOptionalString(event.payload.resumeSelector) ?? 'latest',
          }),
        ],
        renderKind: 'system_notice',
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_FAILED) {
      const turnId = this.readOptionalString(event.payload.turnId);
      const payloadExecutionDetailsLines = this.readStringArray(
        event.payload.executionDetailsLines,
      );
      const details = this.buildExecutionDetailsBlock(
        this.mergeExecutionDetailsLines(
          payloadExecutionDetailsLines,
          turnId ? (resolveTurnDetails?.(turnId) ?? []) : [],
        ),
        translate,
      );
      const errorDetail = this.readOptionalString(event.payload.errorDetail);
      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.SYSTEM,
        label: translate('cli.sessionShell.transcript.systemLabel'),
        lines: [
          translate('cli.sessionShell.responses.turnFailed', {
            reason: this.readOptionalString(event.payload.errorMessage) ?? 'unknown',
          }),
          ...(errorDetail ? [errorDetail] : []),
          translate('cli.sessionShell.responses.turnRecoverableHint'),
        ],
        renderKind: 'system_notice',
        ...(details ? { details } : {}),
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_CANCELLED) {
      const turnId = this.readOptionalString(event.payload.turnId);
      const payloadExecutionDetailsLines = this.readStringArray(
        event.payload.executionDetailsLines,
      );
      const details = this.buildExecutionDetailsBlock(
        this.mergeExecutionDetailsLines(
          payloadExecutionDetailsLines,
          turnId ? (resolveTurnDetails?.(turnId) ?? []) : [],
        ),
        translate,
      );
      return {
        id: `${event.sessionId}:${String(event.sequence)}`,
        role: CliSessionTranscriptRole.SYSTEM,
        label: translate('cli.sessionShell.transcript.systemLabel'),
        lines: [
          translate('cli.sessionShell.responses.turnCancelled'),
          translate('cli.sessionShell.responses.turnRecoverableHint'),
        ],
        renderKind: 'system_notice',
        ...(details ? { details } : {}),
      };
    }

    if (event.type === OrchestrationSessionEventType.TURN_STREAM_DELTA) {
      return null;
    }

    return null;
  }

  private buildCollaborationRecapLines(options: {
    interactionMode?: string;
    invokedRoleIds: string[];
    subagentCount?: number;
    synthesisMode?: string;
    selectedSurface?: string;
    selectedBy?: string;
    translate: (key: string, interpolation?: Record<string, string>) => string;
  }): string[] {
    const modeLabel = this.resolveCollaborationModeLabel(
      options.interactionMode,
      options.translate,
    );
    const lines = [
      options.translate('cli.sessionShell.responses.mainTurnCollaborationAccepted', {
        mode: modeLabel,
      }),
    ];
    if (options.invokedRoleIds.length > 0) {
      lines.push(
        options.translate('cli.sessionShell.responses.mainTurnCollaborationRoles', {
          roles: options.invokedRoleIds.join(' · '),
          count: String(options.subagentCount ?? options.invokedRoleIds.length),
        }),
      );
    }
    if (options.synthesisMode) {
      lines.push(
        options.translate('cli.sessionShell.responses.mainTurnCollaborationSynthesis', {
          synthesisMode: options.synthesisMode,
        }),
      );
    }
    if (options.selectedSurface) {
      lines.push(
        options.translate('cli.sessionShell.responses.mainTurnExecutionSurface', {
          selectedSurface: options.selectedSurface,
        }),
      );
    }
    if (this.isFallbackSurfaceSelection(options.selectedBy)) {
      lines.push(options.translate('cli.sessionShell.responses.mainTurnExecutionSurfaceFallback'));
    }
    return lines;
  }

  private isFallbackSurfaceSelection(selectedBy: string | undefined): boolean {
    if (!selectedBy) {
      return false;
    }
    return /(?:^|[.:| >_-])(?:safe_)?fallback(?:$|[.:| >_-])/iu.test(selectedBy);
  }

  private resolveCollaborationModeLabel(
    interactionMode: string | undefined,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string {
    switch (interactionMode) {
      case 'single_role_delegate':
        return translate('cli.sessionShell.responses.mainTurnCollaborationModeSingleRole');
      case 'serial_role_collaboration':
        return translate('cli.sessionShell.responses.mainTurnCollaborationModeSerial');
      case 'parallel_role_fanout':
        return translate('cli.sessionShell.responses.mainTurnCollaborationModeParallel');
      default:
        return interactionMode ?? 'role collaboration';
    }
  }

  private buildExecutionDetailsBlock(
    lines: string[],
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionShellTranscriptDetailsBlock | undefined {
    const normalizedLines = lines.map((line) => line.trim()).filter((line) => line.length > 0);
    if (normalizedLines.length === 0) {
      return undefined;
    }

    const details: CliSessionShellTranscriptDetailsBlock = {
      title: translate('cli.sessionShell.responses.executionDetailsTitle'),
      summaryLine: '',
      lines: normalizedLines,
      expanded: false,
    };
    details.summaryLine = this.renderExecutionDetailsSummaryLine(details, translate);
    return details;
  }

  private mergeExecutionDetailsLines(primaryLines: string[], secondaryLines: string[]): string[] {
    const mergedLines: string[] = [];
    for (const line of [...primaryLines, ...secondaryLines]) {
      const normalizedLine = line.trim();
      if (normalizedLine.length === 0 || mergedLines.includes(line)) {
        continue;
      }
      mergedLines.push(line);
    }
    return mergedLines;
  }

  private renderExecutionDetailsSummaryLine(
    details: CliSessionShellTranscriptDetailsBlock,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string {
    return translate(
      details.expanded
        ? 'cli.sessionShell.responses.executionDetailsExpanded'
        : 'cli.sessionShell.responses.executionDetailsCollapsed',
      {
        count: String(details.lines.length),
      },
    );
  }

  private mapTranscriptRole(role: OrchestrationSessionTranscriptRole): CliSessionTranscriptRole {
    if (role === OrchestrationSessionTranscriptRole.USER) {
      return CliSessionTranscriptRole.USER;
    }
    if (role === OrchestrationSessionTranscriptRole.ASSISTANT) {
      return CliSessionTranscriptRole.ASSISTANT;
    }
    if (role === OrchestrationSessionTranscriptRole.SLASH_COMMAND) {
      return CliSessionTranscriptRole.SLASH_COMMAND;
    }
    return CliSessionTranscriptRole.SYSTEM;
  }

  private resolveTranscriptLabel(
    role: OrchestrationSessionTranscriptRole,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): string {
    if (role === OrchestrationSessionTranscriptRole.USER) {
      return translate('cli.sessionShell.transcript.userLabel');
    }
    if (role === OrchestrationSessionTranscriptRole.ASSISTANT) {
      return translate('cli.sessionShell.transcript.assistantLabel');
    }
    if (role === OrchestrationSessionTranscriptRole.SLASH_COMMAND) {
      return translate('cli.sessionShell.transcript.slashLabel');
    }
    return translate('cli.sessionShell.transcript.systemLabel');
  }

  private readOptionalString(candidate: unknown): string | undefined {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }

    return undefined;
  }

  private readOptionalNumber(candidate: unknown): number | undefined {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    return undefined;
  }

  private readStringArray(candidate: unknown): string[] {
    if (!Array.isArray(candidate)) {
      return [];
    }

    return candidate.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
  }

  private readOptionalCapabilityAnswerKind(
    candidate: unknown,
  ): CliSessionShellTranscriptItem['capabilityAnswerKind'] {
    return this.readOptionalString(
      candidate,
    ) as CliSessionShellTranscriptItem['capabilityAnswerKind'];
  }

  private readReferencedCapabilityIds(
    candidate: unknown,
  ): CliSessionShellTranscriptItem['referencedCapabilityIds'] {
    const capabilityIds = this.readStringArray(candidate);
    return capabilityIds.length > 0
      ? (capabilityIds as CliSessionShellTranscriptItem['referencedCapabilityIds'])
      : undefined;
  }

  private buildSuggestedActionsBlock(
    candidate: unknown,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionShellTranscriptItem['suggestedActionsBlock'] {
    if (!Array.isArray(candidate)) {
      return undefined;
    }

    const actions = candidate.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') {
        return [];
      }

      const actionRecord = entry as Record<string, unknown>;
      const label = this.readOptionalString(actionRecord.label);
      const target = this.readOptionalString(actionRecord.target);
      const suggestedSlashCommand = this.readOptionalString(actionRecord.suggestedSlashCommand);
      if (!label || !target) {
        return [];
      }

      return [
        {
          label,
          target,
          ...(suggestedSlashCommand ? { suggestedSlashCommand } : {}),
        },
      ];
    });

    return actions.length > 0
      ? {
          title: translate('cli.sessionShell.responses.mainTurnSuggestedActionsTitle'),
          actions,
        }
      : undefined;
  }

  private buildProviderContinuationBlock(
    candidate: unknown,
    translate: (key: string, interpolation?: Record<string, string>) => string,
  ): CliSessionShellTranscriptItem['providerContinuationBlock'] {
    if (!Array.isArray(candidate)) {
      return undefined;
    }

    const lines = candidate.flatMap((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return [];
      }

      const record = entry as Record<string, unknown>;
      const laneLabel = this.readOptionalString(record.laneLabel) ?? `lane-${String(index + 1)}`;
      const surface = this.readOptionalString(record.surface) ?? 'unknown';
      const model = this.readOptionalString(record.model);
      const invalidationReason = this.readOptionalString(record.invalidationReason);
      const lightweightSessionFallbackApplied = record.lightweightSessionFallbackApplied === true;
      const modelSummary = model
        ? translate('cli.sessionShell.responses.providerContinuationModelSummary', {
            model,
          })
        : '';
      const reasonSummary = invalidationReason
        ? translate('cli.sessionShell.responses.providerContinuationReasonSummary', {
            reason: invalidationReason,
          })
        : '';
      const status = this.readOptionalString(record.status);

      if (status === 'created') {
        return [
          translate('cli.sessionShell.responses.providerContinuationCreated', {
            laneLabel,
            surface,
            modelSummary,
          }),
        ];
      }
      if (status === 'reused') {
        return [
          translate('cli.sessionShell.responses.providerContinuationReused', {
            laneLabel,
            surface,
            modelSummary,
          }),
        ];
      }
      if (status === 'refreshed') {
        return [
          translate('cli.sessionShell.responses.providerContinuationRefreshed', {
            laneLabel,
            surface,
            modelSummary,
            reasonSummary,
          }),
        ];
      }
      if (status === 'cleared' || status === 'invalid') {
        return [
          translate('cli.sessionShell.responses.providerContinuationCleared', {
            laneLabel,
            surface,
            modelSummary,
            reasonSummary,
          }),
        ];
      }
      if (status === 'unsupported') {
        return [
          translate(
            lightweightSessionFallbackApplied
              ? 'cli.sessionShell.responses.providerContinuationFallbackActive'
              : 'cli.sessionShell.responses.providerContinuationUnsupported',
            {
              laneLabel,
              surface,
              modelSummary,
              reasonSummary,
            },
          ),
        ];
      }
      return [];
    });

    return lines.length > 0
      ? {
          title: translate('cli.sessionShell.responses.providerContinuationTitle'),
          lines,
        }
      : undefined;
  }

  private readTranscriptRenderKind(
    candidate: unknown,
  ): CliSessionShellTranscriptItem['renderKind'] | undefined {
    if (!candidate || typeof candidate !== 'object') {
      return undefined;
    }

    const renderKind = (candidate as Record<string, unknown>).renderKind;
    if (
      renderKind === 'plain_text' ||
      renderKind === 'markdown' ||
      renderKind === 'system_notice' ||
      renderKind === 'command_recap' ||
      renderKind === 'collaboration_recap'
    ) {
      return renderKind;
    }

    return undefined;
  }

  private readBacklinks(candidate: unknown): CliSessionShellTranscriptBacklink[] {
    if (!Array.isArray(candidate)) {
      return [];
    }

    return candidate
      .map((value) => {
        if (!value || typeof value !== 'object') {
          return null;
        }
        const backlink = value as {
          kind?: unknown;
          label?: unknown;
          target?: unknown;
        };
        if (
          typeof backlink.kind !== 'string' ||
          typeof backlink.label !== 'string' ||
          typeof backlink.target !== 'string'
        ) {
          return null;
        }

        return {
          kind: backlink.kind,
          label: backlink.label,
          target: backlink.target,
        };
      })
      .filter((backlink): backlink is CliSessionShellTranscriptBacklink => backlink !== null);
  }
}
