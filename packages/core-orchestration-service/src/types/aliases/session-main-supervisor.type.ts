import type {
  SESSION_MAIN_HANDOFF_EXECUTION_MODE,
  SESSION_MAIN_INTERACTION_MODE,
  SESSION_MAIN_RESPONSE_MODE,
} from '../../constants/index.js';

export type SessionMainResponseMode =
  (typeof SESSION_MAIN_RESPONSE_MODE)[keyof typeof SESSION_MAIN_RESPONSE_MODE];

export type SessionMainInteractionMode =
  (typeof SESSION_MAIN_INTERACTION_MODE)[keyof typeof SESSION_MAIN_INTERACTION_MODE];

export type SessionMainHandoffExecutionMode =
  (typeof SESSION_MAIN_HANDOFF_EXECUTION_MODE)[keyof typeof SESSION_MAIN_HANDOFF_EXECUTION_MODE];
