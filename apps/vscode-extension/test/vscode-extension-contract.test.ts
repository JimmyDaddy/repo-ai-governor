import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  VSCODE_EXTENSION_CHAT_PARTICIPANT_ID,
  VSCODE_EXTENSION_COMMAND_CAPABILITY_CLASSES,
  VSCODE_EXTENSION_COMMAND_IDS,
  VSCODE_EXTENSION_CONTAINER_ID,
  VSCODE_EXTENSION_CONTINUITY_TOKENS,
  VSCODE_EXTENSION_DESKTOP_RELATIONSHIP,
  VSCODE_EXTENSION_HANDOFF_TARGET_CLASSES,
  VSCODE_EXTENSION_NATIVE_ENTRYPOINTS,
  VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL,
  VSCODE_EXTENSION_QUERY_CAPABILITY_CLASSES,
  VSCODE_EXTENSION_SURFACE_ID,
  VSCODE_EXTENSION_SURFACE_ROLE,
  VSCODE_EXTENSION_TEMPORARY_BRIDGE_CAPABILITY_CLASSES,
  VSCODE_EXTENSION_TRUST_GATED_COMMAND_IDS,
  VSCODE_EXTENSION_TRUTH_OWNER,
  VSCODE_EXTENSION_VIEW_IDS,
  VSCODE_EXTENSION_WEBVIEW_USAGE_MODE,
  VSCODE_EXTENSION_WORKBENCH_PANELS,
} from '../src/constants/index.js';
import { VsCodeExtensionContract } from '../src/runtime/vscode-extension-contract.js';

describe('vscode extension contract freeze', () => {
  it('keeps manifest contributions aligned with the frozen code contract', () => {
    const contract = new VsCodeExtensionContract().createSnapshot();
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'apps/vscode-extension/package.json'), 'utf8'),
    ) as {
      activationEvents: string[];
      capabilities: {
        untrustedWorkspaces: {
          supported: string;
        };
      };
      contributes: {
        viewsContainers: {
          activitybar: Array<{
            id: string;
          }>;
        };
        views: Record<string, Array<{ id: string; type?: string }>>;
        commands: Array<{ command: string }>;
        chatParticipants: Array<{
          id: string;
          commands?: Array<{ name: string }>;
        }>;
      };
    };

    expect(contract.containerId).toBe(VSCODE_EXTENSION_CONTAINER_ID);
    expect(contract.chatParticipantId).toBe(VSCODE_EXTENSION_CHAT_PARTICIPANT_ID);
    expect(contract.surfaceId).toBe(VSCODE_EXTENSION_SURFACE_ID);
    expect(contract.surfaceRole).toBe(VSCODE_EXTENSION_SURFACE_ROLE);
    expect(contract.truthOwner).toBe(VSCODE_EXTENSION_TRUTH_OWNER);
    expect(contract.nativeEntrypoints).toEqual([...VSCODE_EXTENSION_NATIVE_ENTRYPOINTS]);
    expect(contract.workbenchPanels).toEqual([...VSCODE_EXTENSION_WORKBENCH_PANELS]);
    expect(contract.queryCapabilityClasses).toEqual([...VSCODE_EXTENSION_QUERY_CAPABILITY_CLASSES]);
    expect(contract.commandCapabilityClasses).toEqual([
      ...VSCODE_EXTENSION_COMMAND_CAPABILITY_CLASSES,
    ]);
    expect(contract.temporaryBridgeCapabilityClasses).toEqual([
      ...VSCODE_EXTENSION_TEMPORARY_BRIDGE_CAPABILITY_CLASSES,
    ]);
    expect(contract.webviewUsageMode).toBe(VSCODE_EXTENSION_WEBVIEW_USAGE_MODE);
    expect(contract.publicSupportLevel).toBe(VSCODE_EXTENSION_PUBLIC_SUPPORT_LEVEL);
    expect(contract.desktopRelationship).toBe(VSCODE_EXTENSION_DESKTOP_RELATIONSHIP);
    expect(contract.handoffTargets).toEqual([...VSCODE_EXTENSION_HANDOFF_TARGET_CLASSES]);
    expect(contract.continuityTokens).toEqual([...VSCODE_EXTENSION_CONTINUITY_TOKENS]);
    expect(contract.views.map((view) => view.id)).toEqual([
      VSCODE_EXTENSION_VIEW_IDS.TASK_BOARD,
      VSCODE_EXTENSION_VIEW_IDS.HITL_INBOX,
      VSCODE_EXTENSION_VIEW_IDS.REVIEW_QUEUE,
      VSCODE_EXTENSION_VIEW_IDS.AUTOMATION_QUEUE,
      VSCODE_EXTENSION_VIEW_IDS.WORKBENCH_OVERVIEW,
      VSCODE_EXTENSION_VIEW_IDS.REVIEW_DETAIL,
    ]);
    expect(contract.commands.map((command) => command.id)).toEqual([
      VSCODE_EXTENSION_COMMAND_IDS.REFRESH,
      VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL,
      VSCODE_EXTENSION_COMMAND_IDS.OPEN_HANDOFF_TARGET,
      VSCODE_EXTENSION_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE,
      VSCODE_EXTENSION_COMMAND_IDS.SUBMIT_HITL_DECISION,
      VSCODE_EXTENSION_COMMAND_IDS.RECOVER_EXECUTION,
      VSCODE_EXTENSION_COMMAND_IDS.TERMINATE_EXECUTION,
    ]);
    expect(
      contract.commands.filter((command) => command.trustSensitive).map((command) => command.id),
    ).toEqual([...VSCODE_EXTENSION_TRUST_GATED_COMMAND_IDS]);
    expect(manifest.capabilities.untrustedWorkspaces.supported).toBe('limited');
    expect(manifest.contributes.viewsContainers.activitybar[0]?.id).toBe(
      VSCODE_EXTENSION_CONTAINER_ID,
    );
    expect(
      manifest.contributes.views[VSCODE_EXTENSION_CONTAINER_ID]?.map((view) => view.id),
    ).toEqual(contract.views.map((view) => view.id));
    expect(manifest.contributes.commands.map((command) => command.command)).toEqual(
      contract.commands.map((command) => command.id),
    );
    expect(manifest.contributes.chatParticipants[0]?.id).toBe(contract.chatParticipantId);
    expect(
      manifest.contributes.chatParticipants[0]?.commands?.map((command) => command.name),
    ).toEqual(contract.chatCommands.map((command) => command.name));
    expect(manifest.activationEvents).toEqual(
      expect.arrayContaining([
        `onView:${VSCODE_EXTENSION_VIEW_IDS.TASK_BOARD}`,
        `onView:${VSCODE_EXTENSION_VIEW_IDS.HITL_INBOX}`,
        `onView:${VSCODE_EXTENSION_VIEW_IDS.REVIEW_QUEUE}`,
        `onView:${VSCODE_EXTENSION_VIEW_IDS.AUTOMATION_QUEUE}`,
        `onView:${VSCODE_EXTENSION_VIEW_IDS.WORKBENCH_OVERVIEW}`,
        `onView:${VSCODE_EXTENSION_VIEW_IDS.REVIEW_DETAIL}`,
        `onCommand:${VSCODE_EXTENSION_COMMAND_IDS.REFRESH}`,
        `onCommand:${VSCODE_EXTENSION_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE}`,
        `onChatParticipant:${VSCODE_EXTENSION_CHAT_PARTICIPANT_ID}`,
      ]),
    );
  });
});
