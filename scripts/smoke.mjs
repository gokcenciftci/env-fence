import { spawnSync } from 'node:child_process';

function runCli(args, expectedStatus) {
  const result = spawnSync(process.execPath, ['dist/cli.js', ...args], {
    encoding: 'utf8',
  });

  if (result.error) throw result.error;
  if (result.status !== expectedStatus) {
    throw new Error(
      `Expected env-fence to exit ${expectedStatus}, received ${String(result.status)}.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
    );
  }

  return result;
}

console.log('Running CLI smoke checks...');

const secureText = runCli(
  [
    '--env',
    'examples/secure-project/.env',
    '--example',
    'examples/secure-project/.env.example',
    'examples/secure-project',
  ],
  0,
);

const secureJson = runCli(
  [
    '--env',
    'examples/secure-project/.env',
    '--example',
    'examples/secure-project/.env.example',
    'examples/secure-project',
    '--format',
    'json',
  ],
  0,
);
const secureObj = JSON.parse(secureJson.stdout);
if (secureObj.success !== true) {
  throw new Error('Expected secure-project json run to report success: true.');
}

const insecureText = runCli(
  [
    '--env',
    'examples/insecure-project/.env',
    '--example',
    'examples/insecure-project/.env.example',
    'examples/insecure-project',
  ],
  1,
);
if (!insecureText.stdout.includes('Found 7 issue(s)')) {
  throw new Error('Expected insecure-project text run to report 7 issues.');
}

const insecureJson = runCli(
  [
    '--env',
    'examples/insecure-project/.env',
    '--example',
    'examples/insecure-project/.env.example',
    'examples/insecure-project',
    '--format',
    'json',
  ],
  1,
);
const insecureObj = JSON.parse(insecureJson.stdout);
if (insecureObj.success !== false) {
  throw new Error('Expected insecure-project json run to report success: false.');
}
if (insecureObj.summary.errors !== 3) {
  throw new Error(`Expected 3 errors in insecure-project, got ${insecureObj.summary.errors}`);
}
if (insecureObj.summary.warnings !== 4) {
  throw new Error(`Expected 4 warnings in insecure-project, got ${insecureObj.summary.warnings}`);
}

const filterJson = runCli(
  [
    '--env',
    'examples/insecure-project/.env',
    '--example',
    'examples/insecure-project/.env.example',
    'examples/insecure-project',
    '--rules',
    'secret-leak',
    '--format',
    'json',
  ],
  1,
);
const filterObj = JSON.parse(filterJson.stdout);
if (filterObj.issues.length !== 2 || filterObj.issues[0].ruleId !== 'secret-leak') {
  throw new Error('Expected rule filtering to limit output to secret-leak.');
}

runCli(['--env', 'non_existent.env'], 3);

runCli(['--invalid-flag'], 2);

console.log('CLI smoke checks passed successfully.');
