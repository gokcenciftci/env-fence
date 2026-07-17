import { describe, it, expect } from 'vitest';
import { syncEnvRule } from '../src/rules/sync-env.js';
import { missingEnvInCodeRule } from '../src/rules/missing-env-in-code.js';
import { unusedEnvRule } from '../src/rules/unused-env.js';
import { secretLeakRule } from '../src/rules/secret-leak.js';
import type { RuleContext } from '../src/types.js';

describe('sync-env rule', () => {
  it('should pass when env and example keys match', () => {
    const context: RuleContext = {
      envKeys: new Set(['PORT', 'DB_URL']),
      exampleKeys: new Set(['PORT', 'DB_URL']),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map(),
      allFiles: [],
      rawFilesContent: new Map(),
    };
    const issues = syncEnvRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should warn when env has undocumented key', () => {
    const context: RuleContext = {
      envKeys: new Set(['PORT', 'DB_URL', 'EXTRA']),
      exampleKeys: new Set(['PORT', 'DB_URL']),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map(),
      allFiles: [],
      rawFilesContent: new Map([['.env', 'PORT=3000\nDB_URL=...\nEXTRA=123']]),
    };
    const issues = syncEnvRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.message).toContain('missing from example file');
    expect(issues[0]?.line).toBe(3);
  });

  it('should warn when env is missing a key from example', () => {
    const context: RuleContext = {
      envKeys: new Set(['PORT']),
      exampleKeys: new Set(['PORT', 'DB_URL']),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map(),
      allFiles: [],
      rawFilesContent: new Map(),
    };
    const issues = syncEnvRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.message).toContain('missing from env file');
  });
});

describe('missing-env-in-code rule', () => {
  it('should pass when all keys used in code are documented in example', () => {
    const context: RuleContext = {
      envKeys: new Set(),
      exampleKeys: new Set(['PORT', 'DB_URL']),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map([
        ['PORT', [{ file: 'index.ts', line: 1 }]],
        ['DB_URL', [{ file: 'index.ts', line: 2 }]],
      ]),
      allFiles: [],
      rawFilesContent: new Map(),
    };
    const issues = missingEnvInCodeRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should fail when key used in code is missing from example', () => {
    const context: RuleContext = {
      envKeys: new Set(),
      exampleKeys: new Set(['PORT']),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map([
        ['PORT', [{ file: 'index.ts', line: 1 }]],
        ['DB_URL', [{ file: 'index.ts', line: 5 }]],
      ]),
      allFiles: [],
      rawFilesContent: new Map(),
    };
    const issues = missingEnvInCodeRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.message).toContain('not documented in example file');
    expect(issues[0]?.file).toBe('index.ts');
    expect(issues[0]?.line).toBe(5);
  });
});

describe('unused-env rule', () => {
  it('should pass when all example keys are referenced in code', () => {
    const context: RuleContext = {
      envKeys: new Set(),
      exampleKeys: new Set(['PORT']),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map([['PORT', [{ file: 'index.ts', line: 1 }]]]),
      allFiles: [],
      rawFilesContent: new Map(),
    };
    const issues = unusedEnvRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should warn when example key is never referenced in code', () => {
    const context: RuleContext = {
      envKeys: new Set(),
      exampleKeys: new Set(['PORT', 'UNUSED_VAR']),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map([['PORT', [{ file: 'index.ts', line: 1 }]]]),
      allFiles: [],
      rawFilesContent: new Map([['.env.example', 'PORT=\nUNUSED_VAR=\n']]),
    };
    const issues = unusedEnvRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.message).toContain('never used in code');
    expect(issues[0]?.line).toBe(2);
  });
});

describe('secret-leak rule', () => {
  it('should pass for clean files and ignore example file', () => {
    const context: RuleContext = {
      envKeys: new Set(),
      exampleKeys: new Set(),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map(),
      allFiles: ['.env.example', 'index.ts'],
      rawFilesContent: new Map([
        ['.env.example', 'AWS_KEY=AKIA1234567890ABCDEF'], // Allowed in example!
        ['index.ts', 'const port = 3000;'],
      ]),
    };
    const issues = secretLeakRule.run(context);
    expect(issues).toHaveLength(0);
  });

  it('should report AWS key leaks', () => {
    const context: RuleContext = {
      envKeys: new Set(),
      exampleKeys: new Set(),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map(),
      allFiles: ['index.ts'],
      rawFilesContent: new Map([['index.ts', 'const key = "AKIAJXX89FEXAMPLEKEY";']]),
    };
    const issues = secretLeakRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.message).toContain('AWS Access Key ID');
  });

  it('should report Stripe key leaks', () => {
    const context: RuleContext = {
      envKeys: new Set(),
      exampleKeys: new Set(),
      envPath: '.env',
      examplePath: '.env.example',
      usedEnvInCode: new Map(),
      allFiles: ['index.ts'],
      rawFilesContent: new Map([
        ['index.ts', 'const key = "ghp_123456789012345678901234567890123456";'],
      ]),
    };
    const issues = secretLeakRule.run(context);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.message).toContain('GitHub Personal Access Token');
  });
});
