import { ReactCliSessionController } from '../../src/react-cli/index.js';

describe('ReactCliSessionController', () => {
  it('clears optional sections when update explicitly sets them to undefined', () => {
    const controller = new ReactCliSessionController({
      title: '[react-shell:test] Session',
      attentionSection: {
        title: 'Attention',
        lines: ['warn'],
      },
      sections: [
        {
          title: 'Summary',
          lines: ['ok'],
        },
      ],
      helpSection: {
        title: 'Help',
        lines: ['hint'],
      },
      footerShortcutsTitle: 'Shortcuts',
      footerShortcuts: ['Enter'],
    });

    const snapshot = controller.update({
      attentionSection: undefined,
      helpSection: undefined,
    });

    expect(snapshot.attentionSection).toBeUndefined();
    expect(snapshot.helpSection).toBeUndefined();
    expect(snapshot.sections).toEqual([
      {
        title: 'Summary',
        lines: ['ok'],
      },
    ]);
  });

  it('defensively clones and clears agentProjectionPanel state', () => {
    const initialPanel = {
      title: 'Agent projection',
      summaryLine: 'agents=2',
      summaryBadges: ['fallback=1'],
      rows: [
        {
          id: 'coder:default',
          title: 'coder -> github-copilot',
          detailLines: ['profile=coder-default selected_by=fallback status=warn'],
          statusVariant: 'warning' as const,
        },
      ],
    };
    const controller = new ReactCliSessionController({
      title: '[react-shell:test] Session',
      sections: [
        {
          title: 'Summary',
          lines: ['ok'],
        },
      ],
      agentProjectionPanel: initialPanel,
      footerShortcutsTitle: 'Shortcuts',
      footerShortcuts: ['Enter'],
    });

    const initialSnapshot = controller.snapshot();
    initialPanel.summaryBadges.push('blocked=0');
    initialPanel.rows[0]?.detailLines.push('leaked');

    expect(initialSnapshot.agentProjectionPanel?.summaryBadges).toEqual(['fallback=1']);
    expect(initialSnapshot.agentProjectionPanel?.rows[0]?.detailLines).toEqual([
      'profile=coder-default selected_by=fallback status=warn',
    ]);

    const updatedPanel = {
      title: 'Agent projection',
      summaryLine: 'agents=3',
      summaryBadges: ['fallback=2'],
      rows: [
        {
          id: 'reviewer:default',
          title: 'reviewer -> claude-code',
          detailLines: ['profile=reviewer-default selected_by=primary status=pass'],
          statusVariant: 'success' as const,
        },
      ],
    };
    const updatedSnapshot = controller.update({
      agentProjectionPanel: updatedPanel,
    });
    updatedPanel.summaryBadges.push('blocked=1');
    updatedPanel.rows[0]?.detailLines.push('leaked-after-update');

    expect(updatedSnapshot.agentProjectionPanel?.summaryBadges).toEqual(['fallback=2']);
    expect(updatedSnapshot.agentProjectionPanel?.rows[0]?.detailLines).toEqual([
      'profile=reviewer-default selected_by=primary status=pass',
    ]);

    const clearedSnapshot = controller.update({
      agentProjectionPanel: undefined,
    });

    expect(clearedSnapshot.agentProjectionPanel).toBeUndefined();
  });
});
