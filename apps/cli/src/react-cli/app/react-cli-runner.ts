import { type Instance, type RenderOptions, render, renderToString } from 'ink';
import React from 'react';
import type { CliSessionShellViewModel } from '../../types/index.js';
import type { ReactCliViewModel } from '../state/react-cli-view-model.interface.js';
import { ReactCliSessionShellApp } from '../views/session-shell-app.js';
import {
  ReactCliLiveSessionShellApp,
  type ReactCliSessionShellInteractionHandlers,
} from '../views/session-shell-live-app.js';
import { ReactCliApp } from './react-cli-app.js';

/**
 * Owns Ink mount/unmount lifecycle for the shared React CLI shell.
 */
export class ReactCliRunner {
  public constructor(
    private readonly inkRender: typeof render = render,
    private readonly inkRenderToString: typeof renderToString = renderToString,
  ) {}

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
    return this.inkRenderToString(React.createElement(ReactCliApp, { viewModel }), options);
  }

  /**
   * Mounts one React CLI view model into an Ink instance.
   * @param viewModel Shared shell view model.
   * @param options Optional Ink render options.
   * @returns Active Ink render instance.
   */
  public mount(viewModel: ReactCliViewModel, options?: RenderOptions): Instance {
    return this.inkRender(this.createAppElement(viewModel), options);
  }

  /**
   * Rerenders one mounted React CLI tree with the latest shell view model.
   * @param instance Active Ink render instance.
   * @param viewModel Latest shared shell view model.
   * @returns Nothing.
   */
  public rerender(instance: Instance, viewModel: ReactCliViewModel): void {
    instance.rerender(this.createAppElement(viewModel));
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
    return this.inkRenderToString(this.createSessionShellElement(viewModel), options);
  }

  /**
   * Mounts one live session-shell tree into an Ink instance.
   * @param viewModel Session-shell presenter view model.
   * @param options Optional Ink render options.
   * @returns Active Ink render instance.
   */
  public mountSessionShell(viewModel: CliSessionShellViewModel, options?: RenderOptions): Instance {
    return this.inkRender(this.createSessionShellElement(viewModel), options);
  }

  /**
   * Rerenders one mounted session-shell tree with the latest presenter view model.
   * @param instance Active Ink instance.
   * @param viewModel Latest session-shell presenter view model.
   * @returns Nothing.
   */
  public rerenderSessionShell(instance: Instance, viewModel: CliSessionShellViewModel): void {
    instance.rerender(this.createSessionShellElement(viewModel));
  }

  /**
   * Mounts one live session-shell tree with attached Ink interaction handlers.
   * @param viewModel Session-shell presenter view model.
   * @param interactionHandlers Live interaction callbacks translated into runner actions.
   * @param options Optional Ink render options.
   * @returns Active Ink render instance.
   */
  public mountLiveSessionShell(
    viewModel: CliSessionShellViewModel,
    interactionHandlers: ReactCliSessionShellInteractionHandlers,
    options?: RenderOptions,
  ): Instance {
    return this.inkRender(
      this.createLiveSessionShellElement(viewModel, interactionHandlers),
      options,
    );
  }

  /**
   * Rerenders one mounted live session-shell tree with the latest state and handlers.
   * @param instance Active Ink instance.
   * @param viewModel Latest session-shell presenter view model.
   * @param interactionHandlers Live interaction callbacks translated into runner actions.
   * @returns Nothing.
   */
  public rerenderLiveSessionShell(
    instance: Instance,
    viewModel: CliSessionShellViewModel,
    interactionHandlers: ReactCliSessionShellInteractionHandlers,
  ): void {
    instance.rerender(this.createLiveSessionShellElement(viewModel, interactionHandlers));
  }

  private createSessionShellElement(viewModel: CliSessionShellViewModel): React.ReactElement {
    return React.createElement(ReactCliSessionShellApp, { viewModel });
  }

  private createAppElement(viewModel: ReactCliViewModel): React.ReactElement {
    return React.createElement(ReactCliApp, { viewModel });
  }

  private createLiveSessionShellElement(
    viewModel: CliSessionShellViewModel,
    interactionHandlers: ReactCliSessionShellInteractionHandlers,
  ): React.ReactElement {
    return React.createElement(ReactCliLiveSessionShellApp, {
      viewModel,
      interactionHandlers,
    });
  }
}
