# Architecture

EnvFence has a lightweight, deterministic validation pipeline. Each stage has a single responsibility to ensure fast, local-first, zero-dependency environment configuration checking.

```text
cli.ts
  -> scanner.ts (Scanner)
      -> parser (.env/.env.example parser)
      -> code scanner (Regex process.env finder)
      -> rules/* (Pure Rule Functions running over RuleContext)
  -> cli.ts (Reporter & Exit Code Mapper)
```

## Boundaries

| Layer    | Responsibility                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| CLI      | Parses command line arguments, handles options (`--format`, `--rules`), and maps errors to exit codes.     |
| Scanner  | Resolves local paths, parses `.env` & `.env.example`, extracts `process.env` usages, builds `RuleContext`. |
| Rules    | Pure functions evaluating specific parts of the configuration context and returning findings.              |
| Reporter | Prints findings to standard output formatted as human-readable text or structured JSON.                    |

## Exit Codes

EnvFence uses stable exit codes to allow pipelines to react to specific failure classes:

| Exit code | Meaning                                                         |
| --------- | --------------------------------------------------------------- |
| `0`       | Completion successful; no errors found (warnings are bypassed). |
| `1`       | Completion successful; one or more security rule errors found.  |
| `2`       | CLI arguments or configurations are invalid.                    |
| `3`       | File reading, env parsing, or input structural safety error.    |
| `70`      | Unhandled internal tool error.                                  |

## Security Model

The scanner reads only the files passed to it or the local codebase. It never contacts external network endpoints, verifies credentials against cloud providers, or stores reports remotely. It runs 100% offline.
