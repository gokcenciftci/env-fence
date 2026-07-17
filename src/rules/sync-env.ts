import type { Rule, Issue } from '../types.js';

export const syncEnvRule: Rule = {
  id: 'sync-env',
  description: 'Validate that all .env keys exist in .env.example and vice versa.',
  run(context) {
    const issues: Issue[] = [];

    for (const key of context.envKeys) {
      if (!context.exampleKeys.has(key)) {
        const issue: Issue = {
          ruleId: this.id,
          message: `Environment variable "${key}" is defined in env file but missing from example file.`,
          file: context.envPath,
          severity: 'warning',
        };
        const content = context.rawFilesContent.get(context.envPath);
        if (content) {
          const lines = content.split(/\r?\n/);
          const idx = lines.findIndex((l) => l.trim().startsWith(`${key}=`));
          if (idx !== -1) issue.line = idx + 1;
        }
        issues.push(issue);
      }
    }

    for (const key of context.exampleKeys) {
      if (!context.envKeys.has(key)) {
        const issue: Issue = {
          ruleId: this.id,
          message: `Environment variable "${key}" is documented in example file but missing from env file.`,
          file: context.envPath,
          severity: 'warning',
        };
        issues.push(issue);
      }
    }

    return issues;
  },
};
