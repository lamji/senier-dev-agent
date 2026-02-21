---
description: Workflow for initializing and developing MVPs from the ai-builder-template.
---

# MVP Project Initialization & Development Workflow

**Related**: 
- MVP tech stack & execution rules: `.agent/rules/mvp-protocol.md`
- Feature development workflow: `.agent/rules/create-feature.md`

## 1. Initialization Protocol
- **Auto-Init Script**: Run the automation script — this handles EVERYTHING automatically (clone, install, scrub git, scaffold MVVM folders, init logs):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\init-mvp.ps1 -ProjectName "project-name-here"
  ```
- **NEVER ask the user to manually clone, npm install, or create folders** — the script does it all.
- **Template**: Clones from `git@github.com:lamji/ai-builder-template.git` by default.
- **Scrub Environment**: Script automatically removes `.git` folder for a fresh project state.
- **MVVM Scaffold**: Script automatically creates `presentations/`, `components/`, `lib/validation/`, `lib/api-client/`, `hooks/`, `scripts/`, `.logs/`.
- **Log Init**: Script automatically creates `.logs.md` and `.corrections` with correct headers.

## 2. Planning & Alignment
- **Start Timer**: Already handled by `init-mvp.ps1` — timer starts automatically during init.
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
