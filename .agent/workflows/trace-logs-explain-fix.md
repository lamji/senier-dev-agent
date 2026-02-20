---
description: Debugging flow to trace logs, explain the issue, and apply a fix
---

# Debugging Protocol: Trace -> Explain -> Fix

## 1. Check the Issue
- **Reproduce**: Attempt to reproduce the reported issue.
- **Verify**: Confirm the behavior matches the report.

## 2. Trace & Isolate
- **Logs**: grep for error logs or stack traces in the relevant log files.
- **Isolate**: Create a minimal reproduction case or use breakpoints/logging to narrow down the exact conditions. Eliminate external factors.
- **Code**: Locate the specific file and line number causing the error.
- **Context**: Read the surrounding code to understand the state.

## 3. Explain
- **Root Cause**: Determine exactly *why* the logic failed.
- **Impact**: Assess what else might be broken.
- **Plan**: Formulate a fix that addresses the root cause, not just the symptom.

## 4. Fix
- **Implement**: Apply the code change.
- **Verify**: Run the code to ensure the error is gone.
- **Test**: Ensure no regressions were introduced.
