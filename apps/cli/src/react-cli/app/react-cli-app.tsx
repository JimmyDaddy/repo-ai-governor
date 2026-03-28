import { ThemeProvider, defaultTheme } from '@inkjs/ui';
import type React from 'react';
import type { ReactCliViewModel } from '../state/react-cli-view-model.interface.js';
import { ReactCliLayoutShell } from '../views/layout-shell.js';

export interface ReactCliAppProps {
  viewModel: ReactCliViewModel;
}

/**
 * Owns the top-level Ink app wrapper for the shared React CLI shell.
 */
export function ReactCliApp({ viewModel }: ReactCliAppProps): React.JSX.Element {
  return (
    <ThemeProvider theme={defaultTheme}>
      <ReactCliLayoutShell viewModel={viewModel} />
    </ThemeProvider>
  );
}
