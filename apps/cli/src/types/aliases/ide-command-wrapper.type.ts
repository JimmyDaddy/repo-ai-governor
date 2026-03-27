import type { IDE_WRAPPER_SUPPORTED_COMMANDS } from '../../constants/ide-command-wrapper.constant.js';

/**
 * Defines supported IDE wrapper command names as a finite literal union.
 */
export type IdeWrapperCommandName = (typeof IDE_WRAPPER_SUPPORTED_COMMANDS)[number];
