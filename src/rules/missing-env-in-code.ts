import * as path from 'path';
import type { Rule, Issue } from '../types.js';

export const missingEnvInCodeRule: Rule = {
  id: 'missing-env-in-code',
  description:
    'Validate that all environment variables used in code are documented in the example file.',
  run(context) {
    const issues: Issue[] = [];
    const exampleFileName = path.basename(context.examplePath);

    for (const [key, usages] of context.usedEnvInCode.entries()) {
      if (!context.exampleKeys.has(key)) {
        for (const usage of usages) {
          issues.push({
            ruleId: this.id,
            message: `Environment variable "${key}" is used in code but not documented in example file. Please add it to ${exampleFileName}.`,
            file: usage.file,
            line: usage.line,
            severity: 'error',
          });
        }
      }
    }

    return issues;
  },
};
