import type {
  VsCodeExtensionCommandRequest,
  VsCodeExtensionSelectionSnapshot,
} from '../types/index.js';

/**
 * Stores transient UI selection for the extension without becoming a shadow runtime source.
 *
 * Why this exists:
 * the VS Code surface needs to remember which execution the user is drilling into, while keeping
 * orchestration truth service-owned and re-queryable on every action.
 */
export class VsCodeExtensionSelectionStore {
  private snapshot: VsCodeExtensionSelectionSnapshot = {};

  /**
   * Returns the current transient selection snapshot.
   * @returns One shallow-cloned selection snapshot.
   */
  public getSnapshot(): VsCodeExtensionSelectionSnapshot {
    return { ...this.snapshot };
  }

  /**
   * Applies command-derived selection onto the transient store.
   * @param request Optional command request carrying service-owned identifiers.
   */
  public applyCommandRequest(request?: VsCodeExtensionCommandRequest): void {
    if (!request) {
      return;
    }

    if (request.executionId) {
      this.snapshot.executionId = request.executionId;
    }
    if (request.executionSessionId) {
      this.snapshot.executionSessionId = request.executionSessionId;
    }
    if ('reviewSourcePath' in request) {
      this.snapshot.reviewSourcePath = request.reviewSourcePath;
    }
  }

  /**
   * Remembers the selected execution identifiers.
   * @param executionId Execution identifier.
   * @param executionSessionId Optional execution-session identifier.
   */
  public rememberExecution(executionId?: string, executionSessionId?: string): void {
    this.applyCommandRequest({
      executionId,
      executionSessionId,
    });
  }

  /**
   * Remembers the routed review document path from service-owned artifact queries.
   * @param reviewSourcePath Optional review path.
   */
  public rememberReviewSourcePath(reviewSourcePath?: string): void {
    this.applyCommandRequest({
      reviewSourcePath,
    });
  }
}
