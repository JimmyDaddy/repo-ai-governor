/**
 * Defines stable `session.main` response modes projected into shared session truth.
 *
 * Why this exists:
 * session-main supervisor outcomes are a finite business set and should not drift as inline
 * literals across runtime, presenter, and follow-up bootstrap code paths.
 */
export const SESSION_MAIN_RESPONSE_MODE = {
  ANSWER: 'answer',
  FOLLOW_UP_QUESTION: 'follow_up_question',
  COMMAND_HANDOFF_PREVIEW: 'command_handoff_preview',
  ROLE_COLLABORATION: 'role_collaboration',
} as const;

/**
 * Defines stable handoff execution-mode values for natural-language skill routing.
 *
 * Why this exists:
 * session.main must preserve one deterministic distinction between `preview + confirm` and
 * low-risk `direct_execute` paths across dispatcher, shell runner, and resume continuity.
 */
export const SESSION_MAIN_HANDOFF_EXECUTION_MODE = {
  PREVIEW_CONFIRM: 'preview_confirm',
  DIRECT_EXECUTE: 'direct_execute',
} as const;

/**
 * Defines stable interaction-mode values returned by the service-owned supervisor.
 *
 * Why this exists:
 * CLI and future desktop presenters must consume shared interaction metadata instead of inferring
 * local execution meaning from transcript text.
 */
export const SESSION_MAIN_INTERACTION_MODE = {
  DIRECT_ANSWER: 'direct_answer',
  SINGLE_ROLE_DELEGATE: 'single_role_delegate',
  SERIAL_ROLE_COLLABORATION: 'serial_role_collaboration',
  PARALLEL_ROLE_FANOUT: 'parallel_role_fanout',
  COMMAND_HANDOFF: 'command_handoff',
} as const;
