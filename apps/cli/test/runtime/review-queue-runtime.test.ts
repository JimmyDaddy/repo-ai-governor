import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { CliReviewQueueRuntime } from "../../src/runtime/artifacts/review-queue-runtime.js";

describe("Cli review queue runtime", () => {
  it("collects queued review requests from request and legacy directories only", async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), "cli-review-queue-"));
    const reviewQueueRoot = resolve(tempRoot, "context", "review-queue");
    const requestDirectoryPath = resolve(reviewQueueRoot, "requests");

    try {
      await mkdir(requestDirectoryPath, { recursive: true });
      await writeFile(
        resolve(requestDirectoryPath, "review-001.json"),
        JSON.stringify({
          requestId: "review-001",
          status: "queued",
        }),
      );
      await writeFile(
        resolve(reviewQueueRoot, "review-002.json"),
        JSON.stringify({
          status: "queued",
        }),
      );
      await writeFile(
        resolve(requestDirectoryPath, "review-003.json"),
        JSON.stringify({
          requestId: "review-003",
          status: "verified",
        }),
      );
      await writeFile(
        resolve(reviewQueueRoot, "review-verify-004.json"),
        JSON.stringify({
          requestId: "review-verify-004",
          status: "queued",
        }),
      );

      const runtime = new CliReviewQueueRuntime(tempRoot, async (filePath) => {
        const rawContent = await import("node:fs/promises").then(({ readFile }) =>
          readFile(filePath, "utf8"),
        );
        return JSON.parse(rawContent) as Record<string, unknown>;
      });

      const directories = runtime.resolveReviewQueueDirectories();
      const queuedArtifacts = await runtime.collectQueuedReviewRequestArtifacts(directories);

      expect(directories.requestDirectoryPath).toBe(requestDirectoryPath);
      expect(directories.resultDirectoryPath).toBe(resolve(reviewQueueRoot, "results"));
      expect(queuedArtifacts.map((artifact) => artifact.requestId)).toEqual([
        "review-001",
        "review-002",
      ]);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
