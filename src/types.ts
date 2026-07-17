export type IssueSeverity = 'error' | 'warning';

export interface Issue {
  ruleId: string;
  message: string;
  file: string;
  line?: number;
  column?: number;
  severity: IssueSeverity;
}

export interface RuleContext {
  envKeys: Set<string>;
  exampleKeys: Set<string>;
  envPath: string;
  examplePath: string;
  usedEnvInCode: Map<string, Array<{ file: string; line: number }>>;
  allFiles: string[];
  rawFilesContent: Map<string, string>;
}

export interface Rule {
  id: string;
  description: string;
  run(context: RuleContext): Issue[];
}

export interface ScannerOptions {
  paths?: string[];
  rules?: string[];
  envFile?: string;
  exampleFile?: string;
}
