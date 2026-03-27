/**
 * Defines supported local-model providers for adapter runtime contracts.
 *
 * Why this exists:
 * local-model provider ids should stay centralized so config validation,
 * adapter implementation, and diagnostics use one finite vocabulary.
 */
export enum LocalModelProvider {
  OLLAMA = 'ollama',
}
