# Security Rules

EnvFence evaluates environment variables and code files against four core rules. Finding classifications are split into `error` (blocks CI) and `warning` (notifies but permits passing).

| Rule ID               | Severity  | Trigger                                                                                           | Rationale                                                                                                               |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `sync-env`            | `warning` | A key is defined in `.env` but missing from `.env.example` (or vice versa).                       | Ensures all local configurations are documented in the example file, and developers are aware of required keys.         |
| `missing-env-in-code` | `error`   | An environment variable is used in code (`process.env.VAR`) but not documented in `.env.example`. | Prevents code deployment failures caused by undocumented environment variables that are missing in target environments. |
| `unused-env`          | `warning` | A key is documented in `.env.example` but never referenced anywhere in code.                      | Reduces codebase clutter by warning about dead configurations.                                                          |
| `secret-leak`         | `error`   | A key, token, or private key (e.g. AWS, Stripe, GitHub, PEM) is hardcoded in code or env files.   | Prevents credentials exposure and potential server hijack by blocking secrets commits.                                  |

---

## Rule Details

### sync-env

Aligns local `.env` and `.env.example` keys to keep settings documented.

- **Non-compliant**:
  `.env` contains `API_KEY=xxx` but `.env.example` does not contain `API_KEY=`.

### missing-env-in-code

Every variable loaded in code must be documented in the example configuration file.

- **Non-compliant**:
  ```typescript
  const host = process.env.DB_HOST;
  ```
  _(where `DB_HOST` is missing from `.env.example`)_
- **Compliant**:
  Add `DB_HOST=` to `.env.example`.

### unused-env

Removes obsolete configuration keys.

- **Non-compliant**:
  `.env.example` contains `LEGACY_API_URL=` but it is never referenced in code.

### secret-leak

Blocks AWS credentials, private keys, API keys, and other high-risk tokens in tracked files.

- **Non-compliant**:
  ```typescript
  const token = 'ghp_123456789012345678901234567890123456';
  ```
