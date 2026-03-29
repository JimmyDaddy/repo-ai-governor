import { ConfirmInput, MultiSelect, PasswordInput, Select, TextInput } from '@inkjs/ui';
import { type ComponentType, type ReactElement, createElement } from 'react';
import type {
  ReactCliCommandFieldDescriptor,
  ReactCliFieldKind,
  ReactCliFieldOption,
} from './react-cli-command-descriptor-registry.js';
import { ReactCliFieldKind as ReactCliFieldKindEnum } from './react-cli-command-descriptor-registry.js';

export type ReactCliFieldRenderer = (
  descriptor: ReactCliCommandFieldDescriptor,
) => ReactElement<Record<string, unknown>>;

type SelectOption = {
  label: string;
  value: string;
};

const toSelectOptions = (options: ReactCliFieldOption[] | undefined): SelectOption[] =>
  (options ?? []).map((option) => ({
    label: option.label,
    value: option.value,
  }));

const renderComponent = (
  component: ComponentType<Record<string, unknown>>,
  props: Record<string, unknown>,
): ReactElement<Record<string, unknown>> => createElement(component, props);

/**
 * Owns shared `@inkjs/ui` field renderers used by the React CLI shell.
 *
 * Current project-027 consumers only render static summaries through `renderToString()`.
 * These adapters therefore remain read-only previews until a future interactive session
 * controller wires value callbacks into the mounted Ink lifecycle.
 */
export class ReactCliFieldRendererRegistry {
  private readonly renderers = new Map<ReactCliFieldKind, ReactCliFieldRenderer>([
    [
      ReactCliFieldKindEnum.TEXT,
      (descriptor) =>
        renderComponent(TextInput as ComponentType<Record<string, unknown>>, {
          placeholder: descriptor.placeholder ?? descriptor.label,
          onSubmit: () => undefined,
        }),
    ],
    [
      ReactCliFieldKindEnum.PASSWORD,
      (descriptor) =>
        renderComponent(PasswordInput as ComponentType<Record<string, unknown>>, {
          placeholder: descriptor.placeholder ?? descriptor.label,
          onSubmit: () => undefined,
        }),
    ],
    [
      ReactCliFieldKindEnum.SELECT,
      (descriptor) =>
        renderComponent(Select as ComponentType<Record<string, unknown>>, {
          options: toSelectOptions(descriptor.options),
          onChange: () => undefined,
        }),
    ],
    [
      ReactCliFieldKindEnum.MULTI_SELECT,
      (descriptor) =>
        renderComponent(MultiSelect as ComponentType<Record<string, unknown>>, {
          options: toSelectOptions(descriptor.options),
          onChange: () => undefined,
        }),
    ],
    [
      ReactCliFieldKindEnum.CONFIRM,
      () =>
        renderComponent(ConfirmInput as ComponentType<Record<string, unknown>>, {
          onConfirm: () => undefined,
          onCancel: () => undefined,
        }),
    ],
  ]);

  /**
   * Resolves one field renderer by descriptor kind.
   * @param kind Field kind used by the descriptor.
   * @returns Matching renderer or `null`.
   */
  public resolve(kind: ReactCliFieldKind): ReactCliFieldRenderer | null {
    return this.renderers.get(kind) ?? null;
  }

  /**
   * Renders one descriptor through the matching `@inkjs/ui` adapter.
   * @param descriptor Field descriptor to render.
   * @returns Rendered React element or `null`.
   */
  public render(descriptor: ReactCliCommandFieldDescriptor): ReactElement | null {
    const renderer = this.resolve(descriptor.kind);
    return renderer ? renderer(descriptor) : null;
  }
}
