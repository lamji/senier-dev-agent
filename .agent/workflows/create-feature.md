---
description: Workflow for creating new features with isolation and impact analysis
---

# Feature Creation Protocol: Study -> Audit -> Isolate -> Implement

## 1. Identify and Study the Feature
- **Analyze Requirements**: Deeply understand the requested feature.
- **Identify Components**: Determine which Models, ViewModels, and Views are needed.

## 2. Check Context and Changelogs
- **Audit Logs**: Check `.logs` or relevant changelogs in the project to see if this feature impacts previous changes.
- **Conflict Check**: Ensure the new implementation doesn't reverse or conflict with recent bug fixes or features.

## 3. Impact Analysis
- **Flow Mapping**: Check which existing user flows or code paths will be affected by this new feature.
- **Regression Risk**: Identify areas where new code might break existing functionality.

## 4. Isolation & Implementation (Create, Don't Update)
- **New Files Only**: For new features, ALWAYS create new Models, ViewModels, and Views. Do NOT update existing Models or ViewModels to add new feature logic.
- **Dedicated Folders**: Always use separate folders for new features (e.g., `src/Features/NewFeatureName/`).
- **Zero-Contamination**: New feature code must be self-contained. The only "update" allowed to existing code is the minimal line required to import/mount the new feature component.
- **MVVM Adherence**: Follow the project's MVVM standards within the newly created feature structure.

