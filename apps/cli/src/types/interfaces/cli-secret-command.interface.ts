export interface CliSecretCommandOptions {
  action: string | null;
  keyName: string | null;
  backend: string | null;
  stdin: boolean;
  fromEnv: string | null;
}
