import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { CLI_REVIEW_REQUEST_STATUS } from "../../constants/cli-governance-runtime.constant.js";

export interface CliQueuedReviewRequestArtifact {
  fileName: string;
  filePath: string;
  requestId: string;
}

export interface CliReviewQueueDirectorySet {
  requestDirectoryPath: string;
  resultDirectoryPath: string;
  legacyQueueDirectoryPath: string;
}

/**
 * Owns review-queue directory resolution and queued-request discovery for CLI review flows.
 */
export class CliReviewQueueRuntime {
  public constructor(
    private readonly workspaceRoot: string,
    private readonly safeReadJson: (filePath: string) => Promise<Record<string, unknown> | null>,
  ) {}

  /**
   * Resolves review-queue request/result directories.
   * @returns Normalized review-queue directories.
   */
  public resolveReviewQueueDirectories(): CliReviewQueueDirectorySet {
    const legacyQueueDirectoryPath = resolve(this.workspaceRoot, "context", "review-queue");

    return {
      requestDirectoryPath: resolve(legacyQueueDirectoryPath, "requests"),
      resultDirectoryPath: resolve(legacyQueueDirectoryPath, "results"),
      legacyQueueDirectoryPath,
    };
  }

  /**
   * Collects queued review-request artifacts from request/legacy directories.
   * @param reviewQueueDirectories Resolved review-queue directories.
   * @returns Sorted queued request artifacts.
   */
  public async collectQueuedReviewRequestArtifacts(
    reviewQueueDirectories: CliReviewQueueDirectorySet = this.resolveReviewQueueDirectories(),
  ): Promise<CliQueuedReviewRequestArtifact[]> {
    const queuedRequests = new Map<string, CliQueuedReviewRequestArtifact>();
    const candidateDirectories = [
      reviewQueueDirectories.requestDirectoryPath,
      reviewQueueDirectories.legacyQueueDirectoryPath,
    ];

    for (const candidateDirectoryPath of candidateDirectories) {
      if (!existsSync(candidateDirectoryPath)) {
        continue;
      }

      const fileNames = (await readdir(candidateDirectoryPath))
        .filter(
          (fileName) =>
            fileName.startsWith("review-") &&
            fileName.endsWith(".json") &&
            !fileName.startsWith("review-verify-"),
        )
        .sort((left, right) => left.localeCompare(right));

      for (const fileName of fileNames) {
        const filePath = resolve(candidateDirectoryPath, fileName);
        const payload = await this.safeReadJson(filePath);
        if (!payload || payload.status !== CLI_REVIEW_REQUEST_STATUS.QUEUED) {
          continue;
        }

        const requestId =
          typeof payload.requestId === "string" && payload.requestId.trim().length > 0
            ? payload.requestId.trim()
            : fileName.replace(/\.json$/u, "");
        queuedRequests.set(filePath, {
          fileName,
          filePath,
          requestId,
        });
      }
    }

    return Array.from(queuedRequests.values()).sort((left, right) =>
      left.fileName.localeCompare(right.fileName),
    );
  }
}
