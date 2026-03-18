import type { loadResolvedConfig } from "../../config/load-config.js";
import type { resolveRepositoryLayout } from "../../config/repository-layout.js";
import type { EXIT_CODES } from "../../constants/exit-codes.js";

export type ParsedOptions = Record<string, unknown>;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

export type RepositoryLayoutState = ReturnType<typeof resolveRepositoryLayout>;

export type ResolvedConfigState = ReturnType<typeof loadResolvedConfig>;
