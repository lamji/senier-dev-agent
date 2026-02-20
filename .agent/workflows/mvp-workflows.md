---
description: Workflow for initializing and developing MVPs from the ai-builder-template.
---

# MVP Project Initialization & Development Workflow

## 1. Initialization Protocol
- **Folder Creation**: Create a directory in the workspace root named based on the USER prompt.
- **Clone Template**: Clone the base template: `git clone git@github.com:lamji/ai-builder-template.git .`
- **Dependency Setup**: Run `npm install` and verify the lockfile.
- **Scrub Environment**: Immediately remove the `.git` folder from the cloned template to start with a fresh project state.

## 2. Planning & Alignment
- **Start Timer**: Run `powershell -ExecutionPolicy Bypass -File .\scripts\task-timer.ps1 start` at the workspace root.
- **Rules Audit**: Review all rules in `.agent/rules/` before starting.
- **Checklist**: Create a detailed To-Do Checklist and feature extraction plan.
- **USER Approval**: Return the plan/checklist to the USER and wait for explicit approval before writing code.

## 3. Development Standards
- **Feature Extraction**: Isolate new features according to the fragmentation rules.
- **Testing**: Create a CRUD test script for all APIs to verify business logic.
- **Compliance**: Adhere to the PCI DSS security defaults and MVVM project structure.

## 4. Final Handover
- **Process Verification**: Run `npm run lint` and `npm run build`.
- **Reporting**: Present the completed checklist.
- **Stop Timer**: Run `powershell -ExecutionPolicy Bypass -File .\scripts\task-timer.ps1 stop` at the workspace root.
- **Time Tracking**: **MANDATORY**: Report the **Time Consumed** (Duration) exactly as output by the script (e.g., "Done in 15min and 30secs").
