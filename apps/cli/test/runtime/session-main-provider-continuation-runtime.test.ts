import {
  AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY,
  AgentStageContinuationHandleKind,
  AgentStageContinuationStatus,
  AgentStageContinuationTransportKind,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import { AdapterSurface, AdapterTransportKind } from '@repo-ai-governor/shared';
import { SessionMainProviderContinuationPolicyEnvelope } from '../../src/constants/session-main-provider-continuation.constant.js';
import { SessionMainProviderContinuationRuntime } from '../../src/runtime/session-main-provider-continuation-runtime.js';

describe('SessionMainProviderContinuationRuntime', () => {
  it('keeps delegated chat-only turns in chat-only continuation lanes', () => {
    const runtime = new SessionMainProviderContinuationRuntime({
      workspaceRoot: '/tmp/workspace',
      currentWorkingDirectory: '/tmp/workspace',
    });
    const chatOnlyInput = {
      [AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY]: {
        interactionMode: AgentStageExecutionMode.CHAT_ONLY,
        toolUsePolicy: AgentStageToolUsePolicy.FORBIDDEN,
      },
    };

    expect(runtime.resolvePolicyEnvelopeFromInput(chatOnlyInput, 'planner')).toBe(
      SessionMainProviderContinuationPolicyEnvelope.CHAT_ONLY,
    );
    expect(runtime.resolvePolicyEnvelopeFromInput(chatOnlyInput, 'reviewer')).toBe(
      SessionMainProviderContinuationPolicyEnvelope.READ_ONLY,
    );
  });

  it('keeps acp_exec out of provider continuation truth', () => {
    const runtime = new SessionMainProviderContinuationRuntime({
      workspaceRoot: '/tmp/workspace',
      currentWorkingDirectory: '/tmp/workspace',
    });
    const toolConfig: NonNullable<AdaptersConfig['tools']>[number] = {
      toolId: AdapterSurface.CODEX,
      transport: AdapterTransportKind.ACP_EXEC,
      enabled: true,
    };

    const prepared = runtime.prepareRequest({
      sessionId: 'session-acp-001',
      routeId: 'route.coder',
      stageId: 'stage.coder',
      roleId: 'coder',
      selectedSurface: AdapterSurface.CODEX,
      toolConfig,
      providerContinuationState: undefined,
      policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
    });

    expect(prepared).toBeNull();
  });

  it('clears stale provider continuation state when a lane switches to acp_exec', () => {
    const runtime = new SessionMainProviderContinuationRuntime({
      workspaceRoot: '/tmp/workspace',
      currentWorkingDirectory: '/tmp/workspace',
    });
    const toolConfig: NonNullable<AdaptersConfig['tools']>[number] = {
      toolId: AdapterSurface.CODEX,
      transport: AdapterTransportKind.ACP_EXEC,
      enabled: true,
    };
    const laneKey = 'route.coder::stage.coder::coder::codex::mutation_capable';
    const prepared = runtime.prepareRequest({
      sessionId: 'session-acp-002',
      routeId: 'route.coder',
      stageId: 'stage.coder',
      roleId: 'coder',
      selectedSurface: AdapterSurface.CODEX,
      toolConfig,
      providerContinuationState: {
        version: 1,
        slots: {
          [laneKey]: {
            laneKey,
            routeId: 'route.coder',
            stageId: 'stage.coder',
            roleId: 'coder',
            selectedSurface: AdapterSurface.CODEX,
            providerId: 'openai',
            transportKind: AgentStageContinuationTransportKind.REMOTE_API,
            model: 'gpt-5',
            policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
            workspaceRoot: '/tmp/workspace',
            currentWorkingDirectory: '/tmp/workspace',
            handle: {
              providerId: 'openai',
              surface: AdapterSurface.CODEX,
              transportKind: AgentStageContinuationTransportKind.REMOTE_API,
              handleKind: AgentStageContinuationHandleKind.RESPONSE_ID,
              value: 'resp-123',
              model: 'gpt-5',
              acquiredAt: '2026-04-15T02:59:00.000Z',
            },
            updatedAt: '2026-04-15T02:59:00.000Z',
          },
        },
      },
      policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
    });

    expect(prepared).not.toBeNull();
    expect(prepared?.request).toBeUndefined();

    expect(runtime.resolveMutations(prepared ?? null, undefined)).toEqual([
      {
        laneKey,
        summary: {
          laneKey,
          laneLabel: 'coder',
          status: AgentStageContinuationStatus.UNSUPPORTED,
          surface: AdapterSurface.CODEX,
          providerId: 'openai',
          transportKind: AgentStageContinuationTransportKind.REMOTE_API,
          model: 'gpt-5',
          stageId: 'stage.coder',
          roleId: 'coder',
          policyEnvelope: SessionMainProviderContinuationPolicyEnvelope.MUTATION_CAPABLE,
          invalidationReason: 'transport_not_continuation_capable',
        },
      },
    ]);
  });
});
