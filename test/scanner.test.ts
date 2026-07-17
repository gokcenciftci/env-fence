import { describe, it, expect } from 'vitest';
import { Scanner } from '../src/scanner.js';

describe('Scanner tests', () => {
  it('should parse env keys correctly', () => {
    const scanner = new Scanner();
    const content = `
# Comment line
PORT=3000
DATABASE_URL="postgres://localhost"
#Another comment
API_KEY = abc123_key
`;
    const keys = scanner.parseEnvKeys(content);
    expect(keys).toContain('PORT');
    expect(keys).toContain('DATABASE_URL');
    expect(keys).toContain('API_KEY');
    expect(keys).not.toContain('Comment line');
  });

  it('should integration scan secure example', () => {
    const scanner = new Scanner({
      envFile: 'examples/secure-project/.env',
      exampleFile: 'examples/secure-project/.env.example',
      paths: ['examples/secure-project'],
    });
    const issues = scanner.scan();
    expect(issues).toHaveLength(0);
  });

  it('should integration scan insecure example', () => {
    const scanner = new Scanner({
      envFile: 'examples/insecure-project/.env',
      exampleFile: 'examples/insecure-project/.env.example',
      paths: ['examples/insecure-project'],
    });
    const issues = scanner.scan();
    expect(issues.length).toBe(7);
    const ruleIds = issues.map((i) => i.ruleId);
    expect(ruleIds).toContain('sync-env');
    expect(ruleIds).toContain('secret-leak');
    expect(ruleIds).toContain('missing-env-in-code');
    expect(ruleIds).toContain('unused-env');
  });
});
