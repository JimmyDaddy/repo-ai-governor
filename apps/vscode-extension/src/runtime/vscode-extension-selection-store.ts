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

    if (request.clearExecutionSelection) {
      this.snapshot.executionId = undefined;
      this.snapshot.executionSessionId = undefined;
      this.snapshot.queueEntry = undefined;
      this.snapshot.temporaryBridge = undefined;
    }

    if ('executionId' in request) {
      this.snapshot.executionId = request.executionId;
    }
    if ('executionSessionId' in request) {
      this.snapshot.executionSessionId = request.executionSessionId;
    }
    if ('reviewSourcePath' in request) {
      this.snapshot.reviewSourcePath = request.reviewSourcePath;
    }
    if (
      'queueEntry' in request ||
      'temporaryBridge' in request ||
      'executionId' in request ||
      'executionSessionId' in request ||
      'reviewSourcePath' in request
    ) {
      this.snapshot.queueEntry = request.queueEntry;
      this.snapshot.temporaryBridge = request.temporaryBridge;
    }
  }

  /**
   * Remembers the selected execution identifiers and clears any stale review-only backlink.
   * @param executionId Execution identifier.
   * @param executionSessionId Optional execution-session identifier.
   */
  public rememberExecution(executionId?: string, executionSessionId?: string): void {
    this.applyCommandRequest({
      executionId,
      executionSessionId,
      reviewSourcePath: undefined,
    });
  }

  /**
   * Remembers the routed review document path from service-owned artifact queries.
   * @param reviewSourcePath Optional review path.
   */
  public rememberReviewSourcePath(reviewSourcePath?: string): void {
    this.snapshot.reviewSourcePath = reviewSourcePath;
  }
}
