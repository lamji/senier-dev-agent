# Package Selection Protocol (Hard Rule)

## Priority: CRITICAL | Enforcement: MANDATORY

This rule governs how the AI should handle user requests to build or implement high-level features (e.g., "Implement an admin portal", "Create a landing page", "Build a dashboard") using pre-built NPM packages stored in our internal registry.

## 1. The Package Registry
All internally developed, AI-ready NPM packages are documented in the `.agent/npm-packages/` directory. Each `.md` file in this directory represents a distinct package (e.g., `admin-ui-1.md`).

## 2. Triggering the Selection Flow
When a user asks to implement a major feature (like an Admin Portal), but **DOES NOT explicitly specify which package or template to use**, the AI MUST follow this flow:

### Step 1: Scan the Registry
The AI must list the contents of `.agent/npm-packages/` to see what packages are available that match the user's intent.

### Step 2: Prompt the User (Do NOT Guess)
If the user's request is ambiguous (e.g., "Implement an admin portal" and there is more than one admin option, or even if `admin-ui-1` is the only one but the AI wants to confirm), the AI **MUST STOP and ask the user**:
_"Which admin template/package would you like to use? Currently available: [List of packages from the registry]"_

**DO NOT** automatically assume a specific package if the user hasn't clarified. Explicit confirmation is required.

### Step 3: Execute the Implementation
Once the user specifies the package name (e.g., `admin-ui-1`), the AI must:
1. Read the corresponding documentation file (e.g., `.agent/npm-packages/admin-ui-1.md`).
2. Follow the exact installation (`npm install ...`) and integration steps detailed in that document.
3. Apply the specific MVVM mappings and Props architecture defined by the package.

## 3. Catalog Updates
Whenever a new SDK/UI Kit is published to NPM for this workspace, an AI agent MUST add a new `.md` file to `.agent/npm-packages/` detailing its core exports, styling, and how to integrate it, ensuring the "Brain" is always up-to-date with available packages.
