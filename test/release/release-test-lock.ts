import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const RELEASE_TEST_LOCK_DIR = path.join(os.tmpdir(), "repo-ai-governor-release-test.lock");
const RELEASE_TEST_LOCK_TIMEOUT_MS = 120000;
const RELEASE_TEST_LOCK_RETRY_MS = 100;

type AsyncOrSync<T> = Promise<T> | T;

function sleep(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function acquireReleaseTestLock() {
  const startedAt = Date.now();

  while (true) {
    try {
      fs.mkdirSync(RELEASE_TEST_LOCK_DIR);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code !== "EEXIST") {
        throw error;
      }

      if (Date.now() - startedAt > RELEASE_TEST_LOCK_TIMEOUT_MS) {
        throw new Error(
          `Timed out waiting for release test lock: ${RELEASE_TEST_LOCK_DIR} (${RELEASE_TEST_LOCK_TIMEOUT_MS}ms)`,
        );
      }

      await sleep(RELEASE_TEST_LOCK_RETRY_MS);
    }
  }
}

function releaseReleaseTestLock() {
  fs.rmSync(RELEASE_TEST_LOCK_DIR, { recursive: true, force: true });
}

export async function withReleaseTestLock<T>(runner: () => AsyncOrSync<T>): Promise<T> {
  await acquireReleaseTestLock();

  try {
    return await runner();
  } finally {
    releaseReleaseTestLock();
  }
}
