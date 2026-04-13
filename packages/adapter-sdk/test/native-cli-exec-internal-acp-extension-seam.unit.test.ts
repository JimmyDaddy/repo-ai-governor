import * as adapterSdk from '../src/index.js';
import { AgentCliExecOperation } from '../src/index.js';
import { NativeCliExecInternalAcpExtensionSeam } from '../src/native-cli-exec-internal-acp-extension-seam.js';

describe('NativeCliExecInternalAcpExtensionSeam', () => {
  it('keeps the provisional ACP seam out of the adapter-sdk root export surface', () => {
    expect('NativeCliExecInternalAcpExtensionSeam' in adapterSdk).toBe(false);
  });

  it('captures only additive native cli_exec launch facts for internal ACP experimentation', () => {
    const seam = new NativeCliExecInternalAcpExtensionSeam();
    const context = seam.createContext({
      surfaceId: 'codex',
      operation: AgentCliExecOperation.INVOKE,
      command: process.execPath,
      commandArguments: ['-e', "console.log('ok');"],
      cwd: process.cwd(),
      env: process.env,
      timeoutMs: 5000,
      stdinMode: 'ignore',
      launchDiagnostics: {
        selectedEntrypoint: process.execPath,
        shellWrapped: false,
        processTreePolicy: 'process_group_best_effort',
      },
    });

    expect(context).toEqual({
      surfaceId: 'codex',
      operation: AgentCliExecOperation.INVOKE,
      selectedEntrypoint: process.execPath,
      shellWrapped: false,
      processTreePolicy: 'process_group_best_effort',
    });
    expect(context).not.toHaveProperty('transportKind');
    expect(context).not.toHaveProperty('publicTransport');
    expect(() =>
      seam.observeLifecycleEvent(context, {
        phase: 'launch_plan_resolved',
      }),
    ).not.toThrow();
  });
});
