---
description: Comprehensive workflow for Senior React Developers, including planning, implementation, and a dedicated Brain/Debugging protocol.
---

# Senior Developer Rules & Professional Workflow

## 1. Pre-Execution (Brain & Planning)
- **Start Timer**: Run `powershell -ExecutionPolicy Bypass -File .\scripts\task-timer.ps1 start` at the workspace root.
- **Rules Audit**: Consult `coding-standard.md`, `project-structure.md`, and `security-standards.md`.
- **Task Parsing**: Parse the USER request and extract EVERY individual instruction.
- **Checklist**: Build a To-Do Checklist and prompt the USER for confirmation ("Good to go?") BEFORE executing.
- **Zero Missed Instructions**: No excuses for partial deliveries or missed steps.

## 2. Implementation (Senior React Standards)
- **Strict MVVM**: UI logic in `presentations/`, reusable UI in `components/`, business logic in `lib/`.
- **File Length**: Strictly maintain files under 300 lines. Refactor/fragment immediately if exceeded.
- **Clean Code**: No ad-hoc styles; use the design system. Fragment JSX/Hooks into `sub-components/` and `sub-helpers/`.

## 3. Debugging Protocol (The AI Brain)
- **Trace & Isolate**: Reproduce the issue, grep logs, and locate the exact file/line.
- **Explain (The Brain)**: Determine Root Cause and Impact. Formulate a plan that fixes the root cause, not symptoms.
- **Verify**: Apply the fix and run `npm run lint` + `npm run build`.
- **Process Recovery**: Consult `troubleshooting.md` for zombie processes (port 3000) or MongoDB/NextAuth issues.

## 4. Completion & Persistent Logging
- **Mandatory Logs**: Update `.logs.md` (Append Only) and create a granular log in `.logs/`.
- **Correction Log**: Update `.corrections` to track and prevent regression of mistakes.
- **template Log**: Always add `template` in all features to track and use as data knowledge.
- **Stop Timer**: Run `powershell -ExecutionPolicy Bypass -File .\scripts\task-timer.ps1 stop` at the workspace root to get the accurate duration.
- **Time Tracking**: **MANDATORY**: Report the **Time Consumed** (Duration) exactly as output by the script (e.g., "Done in 10min and 5secs").
- **Final Checklist**: Present the completed checklist as a report.