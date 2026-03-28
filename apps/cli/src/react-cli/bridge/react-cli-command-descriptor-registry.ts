import type { CliCommandName } from '../../constants/cli-command.constant.js';

export enum ReactCliFieldKind {
  TEXT = 'text',
  PASSWORD = 'password',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CONFIRM = 'confirm',
}

export interface ReactCliFieldOption {
  label: string;
  value: string;
}

export interface ReactCliCommandFieldDescriptor {
  fieldId: string;
  kind: ReactCliFieldKind;
  label: string;
  placeholder?: string;
  options?: ReactCliFieldOption[];
}

export interface ReactCliCommandDescriptor {
  descriptorId: string;
  commandName: CliCommandName;
  title: string;
  fields: ReactCliCommandFieldDescriptor[];
  helpSectionTitle?: string;
  helpLines?: string[];
  footerShortcuts?: string[];
}

/**
 * Owns command-level descriptor registration for the shared React CLI shell.
 */
export class ReactCliCommandDescriptorRegistry {
  private readonly descriptors = new Map<CliCommandName, ReactCliCommandDescriptor>();

  /**
   * Registers one command descriptor for later shell reuse.
   * @param descriptor Command descriptor to store.
   * @returns Stored descriptor.
   */
  public register(descriptor: ReactCliCommandDescriptor): ReactCliCommandDescriptor {
    this.descriptors.set(descriptor.commandName, descriptor);
    return descriptor;
  }

  /**
   * Resolves one descriptor by command name.
   * @param commandName CLI command name.
   * @returns Registered descriptor or `null`.
   */
  public resolve(commandName: CliCommandName): ReactCliCommandDescriptor | null {
    return this.descriptors.get(commandName) ?? null;
  }

  /**
   * Returns a stable snapshot of all registered descriptors.
   * @returns Command descriptor list.
   */
  public list(): ReactCliCommandDescriptor[] {
    return [...this.descriptors.values()];
  }
}
