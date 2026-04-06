import { VsCodeExtensionSelectionStore } from '../src/runtime/vscode-extension-selection-store.js';

describe('VsCodeExtensionSelectionStore', () => {
  it('clears stale reviewSourcePath when the next command request resolves no review path', () => {
    const selectionStore = new VsCodeExtensionSelectionStore();

    selectionStore.rememberReviewSourcePath('/repo/review-a.md');
    selectionStore.applyCommandRequest({
      executionId: 'execution-b',
      reviewSourcePath: undefined,
    });

    expect(selectionStore.getSnapshot()).toEqual({
      executionId: 'execution-b',
      reviewSourcePath: undefined,
    });
  });
});
