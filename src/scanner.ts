import * as fs from 'fs';
import * as path from 'path';
import { rules } from './rules/index.js';
import type { Issue, ScannerOptions, RuleContext } from './types.js';

export class Scanner {
  private options: ScannerOptions;

  constructor(options: ScannerOptions = {}) {
    this.options = options;
  }

  parseEnvKeys(content: string): Set<string> {
    const keys = new Set<string>();
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        if (key) keys.add(key);
      }
    }
    return keys;
  }

  scan(): Issue[] {
    const allIssues: Issue[] = [];
    const rawFilesContent = new Map<string, string>();

    const envPath = path.resolve(this.options.envFile ?? '.env');
    const examplePath = path.resolve(this.options.exampleFile ?? '.env.example');

    let envContent = '';
    let envKeys = new Set<string>();
    if (fs.existsSync(envPath)) {
      try {
        envContent = fs.readFileSync(envPath, 'utf-8');
        envKeys = this.parseEnvKeys(envContent);
        rawFilesContent.set(envPath, envContent);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        allIssues.push({
          ruleId: 'file-read',
          message: `Failed to read env file: ${msg}`,
          file: envPath,
          severity: 'error',
        });
      }
    } else if (this.options.envFile) {
      allIssues.push({
        ruleId: 'file-read',
        message: `Failed to read env file: File does not exist: ${envPath}`,
        file: envPath,
        severity: 'error',
      });
    }

    let exampleContent = '';
    let exampleKeys = new Set<string>();
    if (fs.existsSync(examplePath)) {
      try {
        exampleContent = fs.readFileSync(examplePath, 'utf-8');
        exampleKeys = this.parseEnvKeys(exampleContent);
        rawFilesContent.set(examplePath, exampleContent);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        allIssues.push({
          ruleId: 'file-read',
          message: `Failed to read example file: ${msg}`,
          file: examplePath,
          severity: 'error',
        });
      }
    } else {
      allIssues.push({
        ruleId: 'file-read',
        message: `Failed to read example file: File does not exist: ${examplePath}`,
        file: examplePath,
        severity: 'error',
      });
    }

    if (allIssues.some((issue) => issue.severity === 'error')) {
      return allIssues;
    }

    const targetFiles: string[] = [];
    if (this.options.paths && this.options.paths.length > 0) {
      for (const p of this.options.paths) {
        const resolvedPath = path.resolve(p);
        if (fs.existsSync(resolvedPath)) {
          const stat = fs.statSync(resolvedPath);
          if (stat.isDirectory()) {
            targetFiles.push(...this.findFiles(resolvedPath));
          } else {
            targetFiles.push(resolvedPath);
          }
        } else {
          allIssues.push({
            ruleId: 'file-read',
            message: `Failed to read workflow file: File or directory does not exist: ${p}`,
            file: resolvedPath,
            severity: 'error',
          });
        }
      }
    } else {
      targetFiles.push(...this.findFiles(process.cwd()));
    }

    for (const file of targetFiles) {
      if (file === envPath || file === examplePath) continue;
      try {
        const content = fs.readFileSync(file, 'utf-8');
        rawFilesContent.set(file, content);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        allIssues.push({
          ruleId: 'file-read',
          message: `Failed to read code file: ${msg}`,
          file: file,
          severity: 'error',
        });
      }
    }

    const usedEnvInCode = new Map<string, Array<{ file: string; line: number }>>();

    for (const file of targetFiles) {
      const content = rawFilesContent.get(file);
      if (!content) continue;

      const lines = content.split(/\r?\n/);
      lines.forEach((line, lineIdx) => {
        const dotRegex = /process\.env\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = dotRegex.exec(line)) !== null) {
          const key = match[1];
          if (key) {
            this.addUsage(usedEnvInCode, key, file, lineIdx + 1);
          }
        }

        const bracketRegex = /process\.env\[['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]\]/g;
        while ((match = bracketRegex.exec(line)) !== null) {
          const key = match[1];
          if (key) {
            this.addUsage(usedEnvInCode, key, file, lineIdx + 1);
          }
        }
      });
    }

    const context: RuleContext = {
      envKeys,
      exampleKeys,
      envPath,
      examplePath,
      usedEnvInCode,
      allFiles: targetFiles,
      rawFilesContent,
    };

    const activeRules = this.options.rules
      ? rules.filter((rule) => this.options.rules?.includes(rule.id))
      : rules;

    for (const rule of activeRules) {
      try {
        const ruleIssues = rule.run(context);
        allIssues.push(...ruleIssues);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        allIssues.push({
          ruleId: rule.id,
          message: `Internal error running rule: ${error.message}`,
          file: examplePath,
          severity: 'warning',
        });
      }
    }

    return allIssues;
  }

  private addUsage(
    map: Map<string, Array<{ file: string; line: number }>>,
    key: string,
    file: string,
    line: number,
  ) {
    let usages = map.get(key);
    if (!usages) {
      usages = [];
      map.set(key, usages);
    }
    usages.push({ file, line });
  }

  private findFiles(dir: string): string[] {
    const files: string[] = [];
    const ignoredDirs = ['node_modules', 'dist', '.git', 'coverage'];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (!ignoredDirs.includes(item)) {
            files.push(...this.findFiles(fullPath));
          }
        } else {
          const ext = path.extname(item).toLowerCase();
          if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (_err) {}
    return files;
  }
}
