/**
 * Normalizes one textual health-check echo response for semantic comparison.
 *
 * Why this exists:
 * Different CLI-backed agents often return trivial formatting variants such as
 * `OK.`, `"OK"`, or `` `OK` `` even when the health check succeeded. We want
 * to accept these benign wrappers while still rejecting longer free-form text.
 *
 * @param responseText Raw response text emitted by the agent.
 * @returns Canonicalized echo token.
 */
export function normalizeHealthCheckEchoResponse(responseText: string): string {
  let normalized = responseText.trim();

  // Remove simple surrounding wrappers repeatedly, such as quotes or backticks.
  while (normalized.length >= 2) {
    const firstCharacter = normalized[0];
    const lastCharacter = normalized.at(-1);
    const isWrapped =
      (firstCharacter === '"' && lastCharacter === '"') ||
      (firstCharacter === "'" && lastCharacter === "'") ||
      (firstCharacter === '`' && lastCharacter === '`');
    if (!isWrapped) {
      break;
    }
    normalized = normalized.slice(1, -1).trim();
  }

  // Accept sentence punctuation variants like OK. / OK! / OK?
  normalized = normalized.replace(/[.!?]+$/u, '').trim();

  return normalized.toUpperCase();
}

/**
 * Compares one health-check response against the expected echo token using
 * tolerant normalization for trivial punctuation/wrapper differences only.
 *
 * @param responseText Raw agent response text.
 * @param expectedResponse Expected canonical echo token.
 * @returns True when the response is semantically equivalent.
 */
export function matchesHealthCheckEchoResponse(
  responseText: string,
  expectedResponse: string,
): boolean {
  return (
    normalizeHealthCheckEchoResponse(responseText) ===
    normalizeHealthCheckEchoResponse(expectedResponse)
  );
}
