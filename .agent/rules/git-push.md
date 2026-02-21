---
description: Quick git workflow to stage, commit, and push to main branch. Triggered by keywords like push to main, push main, push now.
---

# Git Push Workflow

## Trigger Keywords
- "push to main"
- "push main"
- "push now"
- "deploy"
- "ship it"

## Workflow Steps

// turbo-all

### 1. Check Git Status
```bash
git status
```
Review the output. If there are no changes, inform the USER and stop.

### 2. Stage All Changes
```bash
git add .
```

### 3. Review Staged Files
```bash
git diff --cached --stat
```
Show the USER what files will be committed. List them clearly.

### 4. Commit with Descriptive Message
```bash
git commit -m "<type>: <concise description>"
```

**Commit message rules:**
- **Type prefix**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`, `perf:`, `test:`
- **Description**: Short, present tense, no period at end
- **Examples**:
  - `feat: add booking API endpoint with validation`
  - `fix: resolve port 3000 zombie process issue`
  - `docs: add RAG integration guide`
  - `chore: update dependencies`

The AI must generate a meaningful commit message based on the actual changes staged — never use generic messages like "update files".

### 5. Push to Main
```bash
git push origin main
```

If push fails due to remote changes:
```bash
git pull --rebase origin main
git push origin main
```

### 6. Confirm Success
After push completes, report:
- ✅ Branch pushed: `main`
- 📝 Commit message: `<the message used>`
- 📊 Files changed: `<count>`
- 🔗 Remote: `<origin URL>`

## Safety Rules
- **NEVER force push** (`git push --force`) unless USER explicitly says "force push"
- **ALWAYS show staged files** before committing
- **ALWAYS use descriptive commit messages** — never "misc" or "update"
- If there are untracked sensitive files (`.env`, `.env.local`, secrets), **WARN the USER** before staging
