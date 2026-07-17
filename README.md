# EnvFence

[![CI](https://github.com/gokcenciftci/env-fence/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/gokcenciftci/env-fence/actions/workflows/ci.yml)
[![CodeQL](https://github.com/gokcenciftci/env-fence/actions/workflows/codeql.yml/badge.svg?branch=master)](https://github.com/gokcenciftci/env-fence/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

EnvFence scans your environment variables, configuration example files, and codebase to detect configuration issues and hardcoded secrets. It is a deterministic, local-first CI gate: it does not query any external registries, call cloud APIs, or send your codebase anywhere.

> Part of the **Fence Security & Quality Suite** (`SchemaFence`, `ActionFence`, `EnvFence`, `AuditFence`).

> v0.1 is intentionally focused. It prioritizes keeping your environment settings synced and protecting you from credential exposure with zero runtime dependencies.

## Why EnvFence?

Configuring application environments and managing API secrets is a major source of production outages and security breaches. General checkers cannot easily verify if:

- **A new environment variable was introduced in code** but never documented in `.env.example`, causing other environments to fail.
- **A developer added a variable locally** but forgot to document it, leading to hidden settings.
- **Obsolete environment keys** are left in example configs, cluttering setup guides.
- **Hanging credentials or private keys** are hardcoded in git-tracked code or configuration files.

EnvFence runs locally in milliseconds to prevent these issues from reaching production.

## Quick start

EnvFence is executed from a clone or locally built bundle:

```bash
git clone https://github.com/gokcenciftci/env-fence.git
cd env-fence
npm ci
npm run build

# Run scanner against current directory
node dist/cli.js
```

Example output:

```text
examples/insecure-project/.env
  WARNING [sync-env]:4 - Environment variable "AWS_ACCESS_KEY_ID" is defined in env file but missing from example file.
  ERROR [secret-leak]:4 - Potential hardcoded secret detected: AWS Access Key ID.

examples/insecure-project/index.ts
  ERROR [secret-leak]:4 - Potential hardcoded secret detected: Stripe API Key.
  ERROR [missing-env-in-code]:7 - Environment variable "UNDOCUMENTED_VAR" is used in code but not documented in example file. Please add it to .env.example.

examples/insecure-project/.env.example
  WARNING [unused-env]:3 - Environment variable "UNUSED_ENV_VAR" is documented in example file but never used in code.

✖ Found 5 issue(s) (3 error(s), 2 warning(s)).
```

For CI-friendly output, add `--format json`.

## CI contract

```bash
node dist/cli.js \
  --format json
```

| Exit code | Meaning                                                  |
| --------- | -------------------------------------------------------- |
| `0`       | Scan completed; no errors found (warnings are bypassed). |
| `1`       | Scan completed; one or more rule errors found.           |
| `2`       | The command arguments or rule filter is invalid.         |
| `3`       | An input read, file reading, or parsing error occurred.  |
| `70`      | An unexpected internal tool error occurred.              |

JSON output is written to standard output; error logs are written to standard error. JSON outputs use relative paths with forward slashes for cross-platform consistency.

## Rules implemented in v0.1

EnvFence groups checks into warning and error severities.

| Rule ID               | Severity  | Checks                                                                                |
| :-------------------- | :-------- | :------------------------------------------------------------------------------------ |
| `sync-env`            | `warning` | Verifies that all `.env` keys exist in `.env.example` and vice versa.                 |
| `missing-env-in-code` | `error`   | Verifies that all variables used in code (`process.env.VAR`) exist in `.env.example`. |
| `unused-env`          | `warning` | Identifies variables in `.env.example` that are never referenced in code.             |
| `secret-leak`         | `error`   | Scans for private keys, AWS, Stripe, Slack, and GitHub API credentials.               |

Detailed specifications and compliant examples are in [the security rules](docs/security-rules.md).

## Supported inputs and deliberate limits

- Reads local text configurations (typically `.env` and `.env.example`).
- Scans JS, TS, JSX, and TSX files for environment references.
- Runs fully offline without any registry calls.
- Reports missing files as execution errors (Exit `3`).

## Privacy and input safety

EnvFence processes files fully offline. It never communicates with any registry or remote services. Ensure reports containing finding summaries are treated as codebase configuration metadata.

## Architecture

```text
CLI arguments
  -> local scanner
  -> custom .env key parser
  -> process.env token parser
  -> pure rules execution
  -> text / JSON reporter
  -> explicit exit code
```

See [architecture notes](docs/architecture.md) for layers and exit code structures.

## Development

Requires Node.js 20 or newer.

```bash
npm ci
npm run validate
```

`validate` enforces ESLint standards, Prettier code format, TypeScript checks, Vitest code coverage thresholds, production bundle building, and CLI integration smoke checks. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [the Code of Conduct](CODE_OF_CONDUCT.md) for guidelines.

## License

[MIT](LICENSE) © 2026 Gökçen Çiftci
