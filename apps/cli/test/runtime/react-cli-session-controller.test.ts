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
});
