import type { Rule, Issue } from '../types.js';

export const secretLeakRule: Rule = {
  id: 'secret-leak',
  description: 'Detect potential hardcoded secret keys, tokens, or private keys in files.',
  run(context) {
    const issues: Issue[] = [];

    const SECRET_PATTERNS = [
      {
        name: 'AWS Access Key ID',
        regex: /\bAKIA[0-9A-Z]{16}\b/,
      },
      {
        name: 'Slack Webhook URL',
        regex:
          /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Za-z]{8}\/B[0-9A-Za-z]{8}\/[0-9A-Za-z]{24}/,
      },
      {
        name: 'Stripe API Key',
        regex: /\bsk_live_[0-9a-zA-Z]{24,}\b/,
      },
      {
        name: 'GitHub Personal Access Token',
        regex: /\b(ghp|gho|ghu|ghs|ghr)_[0-9a-zA-Z]{36}\b/,
      },
      {
        name: 'GitHub Fine-grained Personal Access Token',
        regex: /\bgithub_pat_[0-9a-zA-Z]{82}\b/,
      },
      {
        name: 'Generic Private Key',
        regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
      },
    ];

    for (const [filePath, content] of context.rawFilesContent.entries()) {
      if (filePath === context.examplePath) continue;

      const lines = content.split(/\r?\n/);
      lines.forEach((line, lineIdx) => {
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(line)) {
            issues.push({
              ruleId: this.id,
              message: `Potential hardcoded secret detected: ${pattern.name}.`,
              file: filePath,
              line: lineIdx + 1,
              severity: 'error',
            });
            break;
          }
        }
      });
    }

    return issues;
  },
};
