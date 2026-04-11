export interface CliSecretBackendStatus {
  backendId: string;
  available: boolean;
  detail: string;
  warning?: string | null;
}

export interface CliSecretBackendRecord {
  keyName: string;
  selector: string;
  backendId: string;
  exists: boolean;
  warning?: string | null;
}

export interface CliSecretBackend {
  readonly backendId: string;

  setLocalizeText?(localizeText: (english: string, chinese: string) => string): void;
  getStatus(environment?: NodeJS.ProcessEnv): Promise<CliSecretBackendStatus>;
  getSecret(keyName: string, environment?: NodeJS.ProcessEnv): Promise<string | null>;
  setSecret(keyName: string, value: string, environment?: NodeJS.ProcessEnv): Promise<void>;
  deleteSecret(keyName: string, environment?: NodeJS.ProcessEnv): Promise<boolean>;
}
