export interface RelativeLayout {
  [key: string]: string;
}

export interface ResolveRepositoryLayoutOptions {
  cwd?: string;
  project?: string;
  sprint?: string;
}

export interface RepositoryLayoutResolution {
  cwd: string;
  relative: RelativeLayout;
  absolute: Record<string, string>;
  naming: {
    projectPattern: string;
    sprintPattern: string;
    sprintExample: string;
    taskPattern: string;
    taskExample: string;
    taskCsvColumns: readonly string[];
    reviewPatterns: {
      pending: string;
      verified: string;
      resolved: string;
    };
    reviewExamples: {
      pending: string;
      verified: string;
      resolved: string;
    };
  };
}
