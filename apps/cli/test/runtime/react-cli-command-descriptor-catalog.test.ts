import { CliCommandName } from '../../src/constants/cli-command.constant.js';
import { ReactCliCommandDescriptorCatalog, ReactCliFieldKind } from '../../src/react-cli/index.js';

describe('ReactCliCommandDescriptorCatalog', () => {
  it('keeps workflow definition source aligned to the select-field contract', () => {
    const catalog = new ReactCliCommandDescriptorCatalog();
    const descriptor = catalog
      .createRegistry({
        translate: (key) => key,
      })
      .resolve(CliCommandName.WORKFLOW);

    expect(descriptor?.fields.find((field) => field.fieldId === 'definitionSource')?.kind).toBe(
      ReactCliFieldKind.SELECT,
    );
  });
});
