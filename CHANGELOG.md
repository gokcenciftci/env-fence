# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-17

### Added

- Initial release of `EnvFence`.
- Embedded rules for environment variables and secrets validation:
  - `sync-env`: Validates that all `.env` keys exist in `.env.example`.
  - `missing-env-in-code`: Ensures that env variables used in code (`process.env.VAR`) are documented in `.env.example`.
  - `unused-env`: Warns about keys in `.env.example` that are never referenced in code.
  - `secret-leak`: Scans code and configuration files for potential hardcoded secret keys or tokens.
- Deterministic, local-first zero-dependency CLI.
- Comprehensive Vitest testing coverage.
