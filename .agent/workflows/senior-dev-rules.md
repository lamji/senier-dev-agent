---
description: Comprehensive workflow for Senior React Developers, including planning, implementation, and a dedicated Brain/Debugging protocol.
---

# Senior Developer Rules & Professional Workflow

## 0. Protocol Audit Proof (Identity Check)
- **MANDATORY**: Before proposing ANY checklist or starting the timer, you MUST read `.agent/memory/logs.md` and `.agent/memory/corrections.md`.
- **Proof of Past Sins**: You MUST start your response by summarizing the **last 3 major entries** from `.logs.md` and the **latest 3 corrections** from `.corrections`.
- **User Confirmation**: Explicitly state: "I have audited my past mistakes and current progress. I am ready to follow the Senior Dev Rules."
- **Failure to do this is a TERMINATION event**. No work starts without this audit.

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
- **Mandatory `data-test-id`**: Every interactive element (Buttons, Inputs, Selects, Links, Modals) MUST include a `data-test-id` attribute. Use the naming convention: `[section]-[type]-[action]` (e.g., `hero-btn-book-now`, `input-client-email`, `modal-btn-search`). This is a **HARD RULE** — no exceptions.

## 3. API & Backend Implementation
- **Mandatory Test Scripts**: For *every* new API endpoint created, an isolated Node.js test script MUST be automatically built in the `scripts/` folder (`scripts/test-[feature].mjs`). 
- **Protected Routes**: If the API endpoint requires an authentication token, the test script MUST be built to simulate the login process first before calling the protected endpoint.
- **Production Safeguards**: Always inject the block flag into test scripts.

## 4. Debugging Protocol (The AI Brain)
- **Trace & Isolate**: Reproduce the issue, grep logs, and locate the exact file/line.
- **Explain (The Brain)**: Determine Root Cause and Impact. Formulate a plan that fixes the root cause, not symptoms.
- **Verify**: Apply the fix and run `npm run lint` + `npm run build`.
- **Process Recovery**: Consult `troubleshooting.md` for zombie processes (port 3000) or MongoDB/NextAuth issues.

## 5. Completion & Persistent Logging
- **Mandatory Logs**: Update `.agent/memory/logs.md` (Append Only) and create a granular log in `.logs/`.
- **Correction Log**: Update `.agent/memory/corrections.md` to track and prevent regression of mistakes.
- **template Log**: Always add `template` in all features to track and use as data knowledge.
- **Stop Timer**: Run `powershell -ExecutionPolicy Bypass -File .\scripts\task-timer.ps1 stop` at the workspace root to get the accurate duration.
- **Time Tracking**: **MANDATORY**: Report the **Time Consumed** (Duration) exactly as output by the script (e.g., "Done in 10min and 5secs").
- **Final Checklist**: Present the completed checklist as a report.