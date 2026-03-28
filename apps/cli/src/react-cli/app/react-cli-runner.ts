import { type Instance, type RenderOptions, render, renderToString } from 'ink';
import React from 'react';
import type { ReactCliViewModel } from '../state/react-cli-view-model.interface.js';
import { ReactCliApp } from './react-cli-app.js';

/**
 * Owns Ink mount/unmount lifecycle for the shared React CLI shell.
 */
export class ReactCliRunner {
  /**
   * Renders one React CLI view model to a string without attaching a live terminal session.
   * @param viewModel Shared shell view model.
   * @param options Optional Ink string-render options.
   * @returns Rendered shell frame.
   */
  public renderFrame(
    viewModel: ReactCliViewModel,
    options?: {
      columns?: number;
    },
  ): string {
    return renderToString(React.createElement(ReactCliApp, { viewModel }), options);
  }

  /**
   * Mounts one React CLI view model into an Ink instance.
   * @param viewModel Shared shell view model.
   * @param options Optional Ink render options.
   * @returns Active Ink render instance.
   */
  public mount(viewModel: ReactCliViewModel, options?: RenderOptions): Instance {
    return render(React.createElement(ReactCliApp, { viewModel }), options);
  }
}
