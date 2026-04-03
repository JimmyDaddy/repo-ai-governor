/**
 * Defines policy envelopes used by session.main lane-scoped provider continuation routing.
 */
export enum SessionMainProviderContinuationPolicyEnvelope {
  CHAT_ONLY = 'chat_only',
  READ_ONLY = 'read_only',
  MUTATION_CAPABLE = 'mutation_capable',
}
