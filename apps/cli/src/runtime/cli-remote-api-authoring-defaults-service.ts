import {
  AdapterProviderKind,
  AdapterSurface,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';

/**
 * Owns authoring-time remote-api defaults shared by connect candidate generation and user-config
 * normalization so both surfaces materialize the same canonical provider/binding/env truth.
 */
export class CliRemoteApiAuthoringDefaultsService {
  public resolveProviderForTool(toolId: AdapterSurface): AdapterProviderKind {
    if (toolId === AdapterSurface.CODEX) {
      return AdapterProviderKind.OPENAI;
    }
    if (toolId === AdapterSurface.CLAUDE_CODE) {
      return AdapterProviderKind.ANTHROPIC;
    }

    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
      `connect remote_api provider mapping is unavailable for ${toolId}.`,
      {
        toolId,
      },
    );
  }

  public resolveVendorBindingForTool(toolId: AdapterSurface): AdapterVendorBindingKind {
    if (toolId === AdapterSurface.CODEX) {
      return AdapterVendorBindingKind.OPENAI_RESPONSES;
    }
    if (toolId === AdapterSurface.CLAUDE_CODE) {
      return AdapterVendorBindingKind.ANTHROPIC_MESSAGES;
    }

    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
      `connect remote_api vendor binding mapping is unavailable for ${toolId}.`,
      {
        toolId,
      },
    );
  }

  public resolveCredentialEnvVarForTool(toolId: AdapterSurface): string {
    if (toolId === AdapterSurface.CODEX) {
      return 'OPENAI_API_KEY';
    }
    if (toolId === AdapterSurface.CLAUDE_CODE) {
      return 'ANTHROPIC_API_KEY';
    }

    throw new RuntimeError(
      GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
      `connect remote_api credential mapping is unavailable for ${toolId}.`,
      {
        toolId,
      },
    );
  }
}
