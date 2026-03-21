import { GovernorErrorCode } from "@repo-ai-governor/shared";
import {
  ArtifactDependencyFailureAction,
  ArtifactDependencyResolutionPolicy,
  ArtifactDependencyResolutionStatus,
  ArtifactDependencyResolver,
  ArtifactLifecycleStatus,
  ArtifactRegistry,
  InMemoryArtifactIndexStore,
} from "../src/index.js";

describe("artifact-registry unit", () => {
  it("registers artifacts and lists versions in descending order", async () => {
    const registry = new ArtifactRegistry(new InMemoryArtifactIndexStore());

    await registry.registerArtifact({
      artifactId: "DA-057",
      artifactType: "audit_recorder_event_model_baseline",
      artifactPath: ".repo-ai-governor/context/dev/project-005/tasks/TK-046.md",
      artifactVersion: "v1",
      artifactStatus: ArtifactLifecycleStatus.ACTIVE,
      producerTaskId: "TK-046",
      producerExecutionId: "exec-20260321-143",
      dependentTasks: ["TK-048", "TK-049", "TK-048"],
      registeredAt: "2026-03-21T14:00:00Z",
      lastUpdatedAt: "2026-03-21T14:00:00Z",
    });
    await registry.registerArtifact({
      artifactId: "DA-057",
      artifactType: "audit_recorder_event_model_baseline",
      artifactPath: ".repo-ai-governor/context/dev/project-005/tasks/TK-046.md",
      artifactVersion: "v2",
      artifactStatus: ArtifactLifecycleStatus.FROZEN,
      producerTaskId: "TK-046",
      producerExecutionId: "exec-20260321-143",
      registeredAt: "2026-03-21T14:00:01Z",
      lastUpdatedAt: "2026-03-21T14:00:01Z",
    });

    const versions = await registry.listArtifactVersions("DA-057");

    expect(versions).toHaveLength(2);
    expect(versions[0]?.artifactVersion).toBe("v2");
    expect(versions[1]?.artifactVersion).toBe("v1");
    expect(versions[1]?.dependentTasks).toEqual(["TK-048", "TK-049"]);
  });

  it("rejects invalid artifact lifecycle status", async () => {
    const registry = new ArtifactRegistry(new InMemoryArtifactIndexStore());

    await expect(
      registry.registerArtifact({
        artifactId: "DA-059",
        artifactType: "artifact_runtime",
        artifactPath: ".repo-ai-governor/context/dev/project-005/tasks/TK-048.md",
        artifactVersion: "v1",
        artifactStatus: "invalid" as ArtifactLifecycleStatus,
        producerTaskId: "TK-048",
        producerExecutionId: "exec-20260321-146",
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ARTIFACT_REGISTRY_RECORD_INVALID,
    });
  });

  it("resolves dependencies with strict exact match", async () => {
    const registry = new ArtifactRegistry(new InMemoryArtifactIndexStore());
    await registry.registerArtifact({
      artifactId: "DA-057",
      artifactType: "audit_recorder_event_model_baseline",
      artifactPath: ".repo-ai-governor/context/dev/project-005/tasks/TK-046.md",
      artifactVersion: "v1",
      artifactStatus: ArtifactLifecycleStatus.ACTIVE,
      producerTaskId: "TK-046",
      producerExecutionId: "exec-20260321-143",
    });

    const resolver = new ArtifactDependencyResolver(registry);
    const result = await resolver.resolve({
      consumerTaskId: "TK-048",
      dependsOnArtifacts: ["DA-057@v1"],
      resolutionPolicy: ArtifactDependencyResolutionPolicy.STRICT,
    });

    expect(result.requiredAction).toBe(ArtifactDependencyFailureAction.ALLOW);
    expect(result.resolutionStatus).toBe(ArtifactDependencyResolutionStatus.RESOLVED);
    expect(result.resolvedArtifacts).toHaveLength(1);
    expect(result.unresolved).toHaveLength(0);
  });

  it("returns blocked status when dependencies are missing", async () => {
    const resolver = new ArtifactDependencyResolver(
      new ArtifactRegistry(new InMemoryArtifactIndexStore()),
    );

    const result = await resolver.resolve({
      consumerTaskId: "TK-048",
      dependsOnArtifacts: ["DA-404"],
      resolutionPolicy: ArtifactDependencyResolutionPolicy.COMPATIBLE,
    });

    expect(result.requiredAction).toBe(ArtifactDependencyFailureAction.BLOCK);
    expect(result.resolutionStatus).toBe(ArtifactDependencyResolutionStatus.BLOCKED);
    expect(result.unresolved).toHaveLength(1);
  });

  it("supports compatible policy and warns on version mismatch when configured", async () => {
    const registry = new ArtifactRegistry(new InMemoryArtifactIndexStore());
    await registry.registerArtifact({
      artifactId: "DA-058",
      artifactType: "report_builder_replay_explain_baseline",
      artifactPath: ".repo-ai-governor/context/dev/project-005/tasks/TK-047.md",
      artifactVersion: "v2",
      artifactStatus: ArtifactLifecycleStatus.ACTIVE,
      producerTaskId: "TK-047",
      producerExecutionId: "exec-20260321-145",
    });

    const resolver = new ArtifactDependencyResolver(registry);
    const result = await resolver.resolve({
      consumerTaskId: "TK-049",
      dependsOnArtifacts: ["DA-058@^v1"],
      resolutionPolicy: ArtifactDependencyResolutionPolicy.COMPATIBLE,
      versionMismatchAction: ArtifactDependencyFailureAction.WARN,
    });

    expect(result.requiredAction).toBe(ArtifactDependencyFailureAction.WARN);
    expect(result.resolutionStatus).toBe(ArtifactDependencyResolutionStatus.WARNED);
    expect(result.unresolved).toHaveLength(1);
  });
});
