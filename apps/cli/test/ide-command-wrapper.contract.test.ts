import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  IDE_SURFACE_REGISTRY,
  IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
  IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS,
  IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS,
  IDE_WRAPPER_SELF_HOSTED_STANDARDS_SOURCE_REGISTRY,
  IDE_WRAPPER_SUPPORTED_COMMANDS,
  IDE_WRAPPER_SUPPORTED_SURFACES,
  IdeCommandWrapper,
  IdeEntrySurface,
} from "../src/main.js";

describe("IDE wrapper contract alignment", () => {
  it("keeps command-wrapper contract JSON aligned with runtime registry", () => {
    const commandWrapperContract = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "integrations/ide/contracts/command-wrapper.contract.json"),
        "utf8",
      ),
    ) as {
      supportedCommands: string[];
      defaultOutputMode: string;
      defaultSurface: string;
      supportedSurfaces: string[];
      environmentKeys: string[];
      surfaceRegistry: Array<{ surfaceId: string }>;
    };

    expect(commandWrapperContract.supportedCommands).toEqual([...IDE_WRAPPER_SUPPORTED_COMMANDS]);
    expect(commandWrapperContract.defaultOutputMode).toBe(IDE_WRAPPER_DEFAULT_OUTPUT_MODE);
    expect(commandWrapperContract.defaultSurface).toBe(IdeEntrySurface.GENERIC_IDE);
    expect(commandWrapperContract.supportedSurfaces).toEqual([...IDE_WRAPPER_SUPPORTED_SURFACES]);
    expect(commandWrapperContract.environmentKeys).toEqual([
      ...IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS,
    ]);
    expect(
      commandWrapperContract.surfaceRegistry.map((surfaceContract) => surfaceContract.surfaceId),
    ).toEqual(IDE_SURFACE_REGISTRY.map((surfaceContract) => surfaceContract.surfaceId));
  });

  it("keeps standards-injection contract JSON aligned with wrapper defaults", () => {
    const standardsInjectionContract = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "integrations/ide/contracts/standards-injection.contract.json"),
        "utf8",
      ),
    ) as {
      defaultSourceIds: string[];
      selfHostedSourceRegistry: Array<{
        sourceId: string;
        sourceKind: string;
        defaultSelfHostedPath: string;
        description: string;
      }>;
    };

    const wrapper = new IdeCommandWrapper();
    expect(wrapper.buildStandardsInjection().sourceIds).toEqual(
      standardsInjectionContract.defaultSourceIds,
    );
    expect(standardsInjectionContract.defaultSourceIds).toEqual([
      ...IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS,
    ]);
    expect(standardsInjectionContract.selfHostedSourceRegistry).toEqual([
      ...IDE_WRAPPER_SELF_HOSTED_STANDARDS_SOURCE_REGISTRY,
    ]);
  });
});
