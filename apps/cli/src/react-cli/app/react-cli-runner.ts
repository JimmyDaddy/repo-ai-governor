import { type Instance, type RenderOptions, render, renderToString } from 'ink';
import React from 'react';
import type { CliSessionShellViewModel } from '../../types/index.js';
import type { ReactCliViewModel } from '../state/react-cli-view-model.interface.js';
import { ReactCliSessionShellApp } from '../views/session-shell-app.js';
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

  /**
   * Renders one session-shell frame to a string without attaching a live terminal session.
   * @param viewModel Session-shell presenter view model.
   * @param options Optional Ink string-render options.
   * @returns Rendered session-shell frame.
   */
  public renderSessionShellFrame(
    viewModel: CliSessionShellViewModel,
    options?: {
      columns?: number;
    },
  ): string {
    return renderToString(React.createElement(ReactCliSessionShellApp, { viewModel }), options);
  }
}
