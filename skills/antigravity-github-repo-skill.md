# Antigravity IDE — GitHub Repository Structure Skill

> A professional reference for structuring, naming, documenting, and preparing any project built with or targeting **Google Antigravity IDE 2.0** before uploading to GitHub.

---

## How to Use This Skill

Import this file into Antigravity IDE as a knowledge base entry or drop it into your project's `.antigravity/` directory as `knowledge.md`. The agent will use it as a style and structure reference when scaffolding new repositories or cleaning up existing ones.

---

## Folder Structure

### General Project

```
my-project/
├── .antigravity/                   # Antigravity agent config and knowledge base
│   ├── agents.json                 # Agent roles, models, permissions
│   ├── knowledge.md                # Project context for agents
│   └── workspace.json              # Panel layout and startup config (optional)
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/                  # CI/CD pipelines (optional)
├── docs/
│   ├── architecture.md             # System diagram and component responsibilities
│   ├── setup.md                    # Detailed environment setup
│   └── agent-guide.md              # How agents should navigate the codebase
├── src/                            # All application source code
│   ├── index.*                     # Entry point
│   ├── components/
│   ├── utils/
│   └── types/
├── tests/                          # Unit and integration tests
├── scripts/                        # Build, setup, and dev scripts
├── README.md                       # Primary project documentation
├── CONTRIBUTING.md                 # Contribution guidelines
├── CHANGELOG.md                    # Version history
├── LICENSE
├── .gitignore
└── .env.example                    # Env variable template — never commit .env
```

### IDE Extension Project

```
antigravity-extension/
├── .antigravity/
│   ├── agents.json
│   └── knowledge.md
├── src/
│   ├── extension.ts                # Activation and command registration
│   ├── commands/
│   ├── providers/
│   └── views/
├── assets/                         # Icons and images
├── docs/
├── tests/
├── antigravity-manifest.json       # Antigravity marketplace metadata
├── package.json                    # Extension manifest (contributes, engines)
├── tsconfig.json
├── .vscodeignore
├── README.md
└── CHANGELOG.md
```

### Agent Plugin Project

```
antigravity-agent-plugin/
├── .antigravity/
│   ├── agents.json                 # Agent capability declarations
│   └── tools.json                  # Tool schema definitions
├── src/
│   ├── plugin.ts                   # Plugin entry point
│   ├── tools/                      # Individual tool implementations
│   └── schemas/                    # Input/output JSON schemas
├── examples/                       # Usage examples and demo scripts
├── tests/
├── plugin-manifest.json            # Antigravity plugin registry metadata
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## File Status Reference

| File | Location | Status | Purpose |
|---|---|---|---|
| `README.md` | root | Required | Overview, requirements, installation, usage |
| `CONTRIBUTING.md` | root | Required | Branch naming, commit format, PR process |
| `CHANGELOG.md` | root | Required | Keep a Changelog format; one entry per release |
| `LICENSE` | root | Required | Standard SPDX license (MIT, Apache-2.0, etc.) |
| `.gitignore` | root | Required | Exclude node_modules, dist, .env, build artifacts |
| `.env.example` | root | Required | All environment variables documented with placeholders |
| `.antigravity/agents.json` | `.antigravity/` | Required | Agent roles, model selection, permissions, off-limits paths |
| `.antigravity/knowledge.md` | `.antigravity/` | Required | Architecture summary and coding conventions for agents |
| `.antigravity/workspace.json` | `.antigravity/` | Optional | Panel layout, startup commands |
| `docs/architecture.md` | `docs/` | Recommended | System diagram and component descriptions |
| `docs/agent-guide.md` | `docs/` | Recommended | Safe zones, off-limits paths, codebase navigation for agents |
| `.github/PULL_REQUEST_TEMPLATE.md` | `.github/` | Recommended | Standardize PR descriptions for human and agent-generated changes |
| `.github/ISSUE_TEMPLATE/` | `.github/` | Recommended | Bug report and feature request templates |
| `antigravity-manifest.json` | root | Extension only | Required for Antigravity IDE marketplace submissions |

---

## README Template

Copy and adapt this for every project. Use sentence case for all headings. No emoji anywhere.

```markdown
# [Project Name]

**[Project Name]** is a [brief noun phrase describing what it does and for whom].

---

## Overview

A concise paragraph (3-5 sentences) explaining:
- What problem this project solves
- How it works at a high level
- Who the intended users are

---

## Features

- [Feature 1] — short description
- [Feature 2] — short description
- [Feature 3] — short description

---

## Requirements

| Requirement        | Minimum Version     | Notes                          |
|--------------------|---------------------|--------------------------------|
| Google Antigravity | 2.0                 | Download at antigravity.google |
| Node.js / Python   | 18+ / 3.11+         | Specify your runtime           |
| Gemini API Key     | Required            | For agent features             |
| Operating System   | macOS / Win / Linux | Cross-platform                 |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/[username]/[repo-name].git
cd [repo-name]

# 2. Install dependencies
npm install   # or: pip install -r requirements.txt

# 3. Copy environment variable template
cp .env.example .env
```

Open the project folder in Antigravity IDE. The `.antigravity/` configuration
will load automatically.

---

## Configuration

Edit `.antigravity/agents.json` to configure agent behavior:

```json
{
  "agents": [
    {
      "id": "main",
      "model": "gemini-3-pro",
      "context": ["src/", "docs/architecture.md"],
      "permissions": ["read", "write", "terminal"]
    }
  ]
}
```

| Field         | Type     | Required | Description                               |
|---------------|----------|----------|-------------------------------------------|
| `id`          | string   | Yes      | Unique agent identifier                   |
| `model`       | string   | Yes      | gemini-3-pro, gemini-3-deep-think, etc.   |
| `context`     | string[] | No       | Paths the agent reads for context         |
| `permissions` | string[] | Yes      | read, write, terminal, browser            |

---

## Usage

### Quick start

```bash
npm run dev   # or: python main.py
```

### With Antigravity agent

1. Open the Manager Surface in Antigravity IDE
2. Spawn an agent using the configuration in `.antigravity/agents.json`
3. Describe your task in natural language
4. Review the implementation plan before approving execution

---

## Project Structure

```
[repo-name]/
├── .antigravity/         Agent configuration and knowledge base
├── .github/              Issue templates, PR templates, CI workflows
├── docs/                 Extended documentation
├── src/                  Application source code
├── tests/                Test suites
├── scripts/              Build and utility scripts
├── .env.example          Environment variable reference
├── README.md             This file
├── CONTRIBUTING.md       Contribution guidelines
└── CHANGELOG.md          Version history
```

---

## Development

```bash
npm run build      # production build
npm run test       # run test suite
npm run lint       # lint all files
```

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
development workflow, code style rules, and pull request process.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full version history.

---

## License

This project is licensed under the [LICENSE NAME] License.
See [LICENSE](LICENSE) for details.
```

---

## .antigravity/agents.json Template

```json
{
  "version": "2.0",
  "project": {
    "name": "[Project Name]",
    "description": "One-line description for agent context",
    "language": "typescript",
    "entrypoint": "src/index.ts"
  },
  "agents": [
    {
      "id": "primary",
      "model": "gemini-3-pro",
      "role": "Full-stack implementation agent",
      "context_paths": ["src/", "docs/architecture.md", ".antigravity/knowledge.md"],
      "permissions": ["read", "write", "terminal"],
      "off_limits": [".env", "secrets/", "*.key"]
    },
    {
      "id": "reviewer",
      "model": "gemini-3-deep-think",
      "role": "Code review and architecture validation",
      "context_paths": ["src/", "tests/"],
      "permissions": ["read"]
    }
  ]
}
```

---

## .antigravity/knowledge.md Template

```markdown
# Agent Knowledge Base

## Project Summary
[One paragraph: what the project is, what it does, who uses it.]

## Architecture
- [Component A] — what it does and its location
- [Component B] — what it does and its location
- [Component C] — what it does and its location

## Key Files

| File                  | Role                                      |
|-----------------------|-------------------------------------------|
| `src/index.ts`        | Application entry point                   |
| `src/config.ts`       | All environment and runtime configuration |
| `src/utils/logger.ts` | Logging utility used across all modules   |

## Coding Conventions
- Language: TypeScript (strict mode)
- Formatter: Prettier with default config
- Linter: ESLint with recommended rules
- Test runner: Vitest
- Import style: ES modules, no CommonJS require()

## Off-Limits Paths
Agents must never modify: `.env`, `secrets/`, `*.pem`, `*.key`

## Frequently Used Commands
```bash
npm run dev       # start development server
npm run test      # run test suite
npm run build     # production build to dist/
```
```

---

## CONTRIBUTING.md Template

```markdown
# Contributing

Thank you for considering a contribution to [Project Name].
Please read this guide before opening a pull request.

## Development Setup

```bash
git clone https://github.com/[username]/[repo].git
cd [repo]
npm install
cp .env.example .env
```

## Branch Naming

| Type      | Pattern                      | Example                    |
|-----------|------------------------------|----------------------------|
| Feature   | `feat/short-description`     | `feat/agent-context-panel` |
| Bug fix   | `fix/short-description`      | `fix/token-refresh-loop`   |
| Docs      | `docs/short-description`     | `docs/agent-guide-update`  |
| Refactor  | `refactor/short-description` | `refactor/tool-schema`     |

## Commit Messages

Follow Conventional Commits: `type(scope): description`

- `feat(agents): add multi-agent orchestration config`
- `fix(workspace): resolve panel layout reset on reload`
- `docs(readme): update installation steps for Antigravity 2.0`

## Pull Request Process

1. Fork the repository and create a branch from `main`
2. Make your changes and add or update tests as needed
3. Ensure all tests pass: `npm run test`
4. Ensure linting passes: `npm run lint`
5. Open a pull request against `main` using the PR template

## Code Style

- Follow the formatting rules in `.prettierrc` or `pyproject.toml`
- No commented-out code in committed files
- All exported functions must have JSDoc or docstring documentation
- Maximum line length: 100 characters

## Agent-Generated Code

Code generated by Antigravity agents is accepted, subject to the same review
standards as human-written code. The PR description must note which sections
were agent-generated and include the task prompt used.
```

---

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Directories | `kebab-case` | `agent-tools/`, `api-routes/` |
| TypeScript / JS modules | `camelCase` | `tokenRefresh.ts` |
| TypeScript / JS components | `PascalCase` | `AgentPanel.tsx` |
| Python files | `snake_case` | `agent_runner.py` |
| Config files | Standard dotfile or `kebab-case.json` | `.prettierrc`, `jest.config.js` |
| Root documentation | `SCREAMING_SNAKE_CASE.md` | `README.md`, `CHANGELOG.md` |
| Docs directory files | `kebab-case.md` | `docs/agent-guide.md` |
| Environment files | `.env.example` committed; `.env` gitignored | `.env.example` |
| Test files | Mirror source with `.test.` or `.spec.` suffix | `tokenRefresh.test.ts` |
| Antigravity config | Lowercase JSON inside `.antigravity/` | `.antigravity/agents.json` |
| GitHub templates | Uppercase markdown in `.github/` | `PULL_REQUEST_TEMPLATE.md` |

---

## Standard .gitignore

```gitignore
# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
out/
.next/
.nuxt/
.svelte-kit/
*.tsbuildinfo

# Python
__pycache__/
*.py[cod]
*.egg-info/
.venv/
venv/
.pytest_cache/
htmlcov/
.coverage

# OS artifacts
.DS_Store
Thumbs.db
Desktop.ini

# IDE / Editor
.vscode/settings.json
.idea/
*.suo
*.user

# Logs
*.log
logs/
npm-debug.log*

# Test coverage
coverage/
lcov.info

# Secrets and keys
*.pem
*.key
*.p12
secrets/

# Note: .antigravity/ should be committed — it is project config, not secrets
```

---

## Pre-Upload Checklist

Run through every item before pushing to GitHub.

### Required

- [ ] `README.md` present with overview, requirements table, installation, usage, structure, and license
- [ ] `.antigravity/agents.json` present with at least one agent definition
- [ ] `.antigravity/knowledge.md` present with project summary, architecture, and key file map
- [ ] `.gitignore` covers `node_modules/`, `dist/`, `.env`, `__pycache__`, `.DS_Store`
- [ ] `.env.example` documents every environment variable with placeholder values and comments
- [ ] `LICENSE` file present with a standard SPDX license
- [ ] `CHANGELOG.md` follows Keep a Changelog format
- [ ] `CONTRIBUTING.md` covers branch naming, commit format, PR process, and agent-generated code policy
- [ ] No commented-out code in any committed file
- [ ] No real secrets, API keys, or credentials committed anywhere

### Recommended

- [ ] `docs/agent-guide.md` explains off-limits paths, architecture, and naming conventions for agents
- [ ] All tests pass locally before the PR is opened
- [ ] `.github/ISSUE_TEMPLATE/` has separate bug report and feature request templates
- [ ] GitHub repository description is under 160 characters
- [ ] GitHub repository topics include `antigravity-ide`, `gemini`, and relevant stack tags
- [ ] `docs/architecture.md` includes a system diagram or component breakdown

---

## CHANGELOG Format Reference

```markdown
# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.0.0] - YYYY-MM-DD

### Added
- Initial release
- Antigravity 2.0 agent configuration

### Changed
- N/A

### Fixed
- N/A
```

---

## Quick Reference Card

| What you need | File to create or edit |
|---|---|
| Tell agents how to understand the project | `.antigravity/knowledge.md` |
| Define agent roles and permissions | `.antigravity/agents.json` |
| Document the project for humans | `README.md` |
| Standardize contributions | `CONTRIBUTING.md` |
| Track version history | `CHANGELOG.md` |
| Prevent secrets from being committed | `.gitignore` + `.env.example` |
| Help agents avoid dangerous paths | `.antigravity/agents.json` → `off_limits` |
| Guide agent code reviews | `docs/agent-guide.md` |
