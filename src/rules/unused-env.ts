import type { Rule, Issue } from '../types.js';

export const unusedEnvRule: Rule = {
  id: 'unused-env',
  description:
    'Detect environment variables defined in example file that are never referenced in code.',
  run(context) {
    const issues: Issue[] = [];

    for (const key of context.exampleKeys) {
      if (!context.usedEnvInCode.has(key)) {
        const issue: Issue = {
          ruleId: this.id,
          message: `Environment variable "${key}" is documented in example file but never used in code.`,
          file: context.examplePath,
          severity: 'warning',
        };
        const content = context.rawFilesContent.get(context.examplePath);
        if (content) {
          const lines = content.split(/\r?\n/);
          const idx = lines.findIndex((l) => l.trim().startsWith(`${key}=`));
          if (idx !== -1) issue.line = idx + 1;
        }
        issues.push(issue);
      }
    }

    return issues;
  },
};
