---
description: Automated protocol for versioning, building, and publishing npm packages
---

# NPM Publish Protocol

This workflow defines the fully automated process for publishing npm packages without any human interaction. It enforces semantic versioning and a standard build-to-publish pipeline.

## 1. Incremental Version Bump
Determine the correct semantic version increment (patch, minor, major) based on the latest changes. Apply the version bump automatically:
// turbo-all
```bash
npm version <update-type> --no-git-tag-version
```
*(Replace `<update-type>` with `patch`, `minor`, or `major` depending on the update magnitude.)*

## 2. Install and Build
Cleanly install dependencies and build the project to generate the final distribution files:
```bash
npm install
npm run build
```

## 3. Publish to NPM
Execute the publish command. This step assumes that authentication is already handled in the environment (e.g., via `NPM_TOKEN` or `.npmrc`):
```bash
npm publish --access public
```

## Automation Rules
- **No Human Interaction**: The sequence of versioning, building, and publishing MUST be executed automatically.
- **Sequential Execution**: Do not proceed to the publish step if the build fails.
- **Turbo execution**: This workflow features the `// turbo-all` annotation, meaning all bash commands involved in this publish sequence should be auto-run without explicitly waiting for user approval.
