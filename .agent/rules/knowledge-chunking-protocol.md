---
description: Protocol for writing knowledge base files that align with RAG chunking and semantic search
---

# Knowledge Base Chunking Protocol

**Category**: RAG / Knowledge Management  
**Priority**: CRITICAL  
**Enforcement**: MANDATORY for all new rules, templates, and memory files

---

## Problem

Knowledge base files were failing semantic search tests (83% pass rate) because:
1. Critical keywords were scattered across sections
2. Numeric thresholds (e.g., "3-Use Rule") were not preserved in chunks
3. Design specifications (e.g., "10px blur", "2-link sidebar") were fragmented
4. Section headers didn't include searchable context

---

## Solution: Chunking-Aware Writing

### 1. Structure: Use ## Headers for Semantic Boundaries

**Rule**: Every knowledge file MUST use `## Section Headers` to mark logical chunks. Each chunk becomes a searchable unit.

**Bad** (no headers):
```markdown
# Admin Dashboard Rules
The admin dashboard must use glassmorphism design with 10px blur. 
It should have exactly 2 navigation links: Dashboard and the primary feature.
The sidebar should be dark (#1e293b) and the content area light (#f8fafc).
```

**Good** (with semantic headers):
```markdown
# Admin Dashboard Rules

## Design Specifications
The admin dashboard must use glassmorphism design with 10px blur, consistent rounded corners (3xl/2xl).
The sidebar should be dark (#1e293b) and the content area light (#f8fafc).

## Navigation Structure
The admin sidebar MUST contain exactly 2 primary navigation links:
1. **Dashboard**: Analytics and overviews specific to the MVP
2. **Primary Feature**: Link directly related to core MVP functionality (e.g., "Bookings")

## Interactive States
Every clickable element MUST implement hover effects and smooth transitions.
Dropdowns must support clicking outside to close.
```

**Why**: Each `##` section becomes a separate chunk. The chunker preserves the `# Title` + `## Section` context, ensuring keywords stay together.

---

### 2. Keyword Preservation: Include Searchable Terms Explicitly

**Rule**: Critical keywords MUST appear in the section content, not just in headers.

**Bad** (keyword only in header):
```markdown
## 3-Use Rule
When logic is repeated 3+ times, extract it.
```

**Good** (keyword in content):
```markdown
## Scalability: The 3-Use Rule
The "3-Use Rule" is mandatory: Any logic, utility, or UI pattern used in **3 or more places** MUST be abstracted into a shared resource.
This rule applies to:
- Custom hooks (extract to `src/lib/hooks/`)
- Utility functions (extract to `src/lib/utils/`)
- UI components (extract to `src/components/shared/`)
```

**Why**: The chunker detects keywords via `TAG_KEYWORDS` dictionary. If "3-use" appears in content, it tags the chunk with `scalability`. Semantic search then finds it.

---

### 3. Numeric Thresholds: Always Spell Out Numbers

**Rule**: Numeric values MUST appear as both digits AND words.

**Bad**:
```markdown
Maximum file length is 300 lines.
```

**Good**:
```markdown
Maximum file length is **300 lines**. No file shall exceed 300 lines of code.
```

**Why**: Semantic search may match "three hundred" or "300" or "three-hundred". Including both ensures retrieval.

---

### 4. Design Specifications: Group Related Details

**Rule**: Design specs MUST be grouped in a single section with all measurements and colors.

**Bad** (scattered):
```markdown
## Glassmorphism
Use glassmorphism design.

## Blur
The blur should be 10px.

## Corners
Use rounded corners (3xl/2xl).
```

**Good** (grouped):
```markdown
## Glassmorphism Design Specifications
The admin dashboard MUST use glassmorphism design with the following specifications:
- **Blur**: 10px backdrop blur
- **Rounded Corners**: 3xl/2xl consistent rounding
- **Colors**: Dark sidebar (#1e293b), light content (#f8fafc)
- **Transparency**: Use bg-white/70 with backdrop-blur-xl
```

**Why**: When chunked, all design specs stay together. Queries for "glassmorphism" or "10px blur" find the complete specification.

---

### 5. Mandatory vs Optional: Use Clear Markers

**Rule**: Use `MUST`, `MANDATORY`, `CRITICAL` for hard rules. Use `SHOULD`, `RECOMMENDED` for guidelines.

**Bad**:
```markdown
The sidebar might have 2 links.
```

**Good**:
```markdown
The admin sidebar MUST contain exactly 2 primary navigation links (MANDATORY).
```

**Why**: The chunker detects `MUST`, `MANDATORY`, `CRITICAL` and tags with `priority: critical`. This ensures high-priority rules surface first in search results.

---

### 6. Related Rules: Cross-Reference Explicitly

**Rule**: When a rule depends on another, include a "Related" section.

**Example**:
```markdown
# Feature Creation Protocol

## Related Rules
- See `.agent/rules/coding-standard.md` for MVVM structure
- See `.agent/rules/scalability-protocol.md` for the 3-Use Rule
- See `.agent/rules/template-lookup.md` for template discovery

## 1. Study the Feature
...
```

**Why**: Helps users find connected rules. The chunker preserves these references, so semantic search can follow the knowledge graph.

---

## Chunker Tag Keywords (Reference)

The chunker automatically tags chunks based on keywords. When writing, include these keywords to ensure proper categorization:

### Admin Dashboard
Keywords: `admin`, `dashboard`, `sidebar`, `table`, `manage`, `glassmorphism`, `10px blur`, `2-link`, `desktop-first`

### Debugging
Keywords: `debug`, `trace`, `error`, `fix`, `bug`, `troubleshoot`, `log`, `issue`, `internal audit`, `reproduce`, `binary search`, `root cause`

### MVVM
Keywords: `mvvm`, `viewmodel`, `model`, `view`, `presentation`, `separation`, `study`, `audit`, `isolate`, `implement`

### Scalability
Keywords: `scalability`, `scale`, `growth`, `modular`, `barrel`, `dry`, `3-use`, `three`, `strict`, `typescript`

### Security
Keywords: `security`, `pci`, `encryption`, `xss`, `csrf`, `cors`, `sanitize`, `rate limit`, `aes-256`, `bcrypt`, `never store pan`, `zod`

### Testing
Keywords: `test`, `lint`, `build`, `verify`, `validate`, `jest`, `vitest`, `test:api`, `commit message`

### UI/UX
Keywords: `glassmorphism`, `animation`, `framer`, `hover`, `micro-interaction`, `responsive`, `premium`, `10px blur`, `rounded corners`

---

## Template: New Rule File Structure

Use this template when creating new rule files:

```markdown
---
description: [One-sentence description of the rule]
---

# [Rule Title]

**Category**: [rule/workflow/template/memory]  
**Priority**: [critical/high/normal]  
**Related**: 
- `.agent/rules/[related-rule].md`
- `.agent/rules/[related-rule].md`

## Problem

[What issue does this rule solve?]

---

## Solution

### 1. [First Concept]
[Detailed explanation with keywords]

### 2. [Second Concept]
[Detailed explanation with keywords]

---

## Implementation Checklist

- [ ] [Specific action 1]
- [ ] [Specific action 2]
- [ ] [Specific action 3]

---

## Examples

### Good Example
[Code or pattern that follows the rule]

### Bad Example
[Code or pattern that violates the rule]

---

## Key Takeaways

1. [Lesson 1]
2. [Lesson 2]
3. [Lesson 3]
```

---

## Validation Checklist (Before Committing)

Before adding a new rule file, verify:

- [ ] File uses `## Section Headers` for logical chunks
- [ ] Critical keywords appear in content (not just headers)
- [ ] Numeric values spelled out (e.g., "3 or more places")
- [ ] Design specs grouped in single section
- [ ] MUST/MANDATORY/CRITICAL marked clearly
- [ ] Related rules cross-referenced
- [ ] No section is longer than 500 characters (fits in one chunk)
- [ ] File includes at least one example (good + bad)

---

## Chunker Configuration (For Reference)

The RAG system chunks files as follows:

1. **Split by `##` headers**: Each section becomes a chunk
2. **Preserve context**: Each chunk includes `# Title` + `## Section` + content
3. **Minimum size**: Chunks must be >50 characters (prevents empty chunks)
4. **Tag detection**: Keywords in content trigger automatic tagging
5. **Priority detection**: MUST/MANDATORY/CRITICAL trigger `priority: critical`

---

## Examples: Before & After

### Example 1: Scalability Rule

**Before** (Failed test: 0% match for "3-Use Rule"):
```markdown
# Scalability Protocol

## Codebase Scalability
- **The "3-Use" Rule**: Any logic used in 3+ places should be abstracted.
```

**After** (Passes test: 100% match):
```markdown
# Scalability Protocol

## Codebase Scalability: The 3-Use Rule
The "3-Use Rule" is a critical hard rule: Any logic, utility, or UI pattern used in **3 or more places** MUST be abstracted into a shared resource (`src/lib/` or `src/components/shared/`).

This rule applies to:
- **Custom hooks**: Extract to `src/lib/hooks/`
- **Utility functions**: Extract to `src/lib/utils/`
- **UI components**: Extract to `src/components/shared/`

**Strict Typing**: TypeScript `strict` mode is non-negotiable.
- **No `any`**: Explicitly define types/interfaces for all Props, State, and API responses.
- **Shared Interfaces**: Domain entities must be defined in `src/types/` and reused.
- **Barrel Exports**: Use `index.ts` files in folders to expose only the public API.
```

### Example 2: Admin Dashboard Rule

**Before** (Failed test: 0% match for "glassmorphism, 10px blur, 2-link, desktop"):
```markdown
# Admin Dashboard Rules

The admin dashboard must follow these rules:
- Use glassmorphism design
- Apply 10px blur
- Have 2 navigation links
- Desktop-first design
```

**After** (Passes test: 100% match):
```markdown
# Admin Dashboard Design & Navigation Rules

## Glassmorphism Design Specifications
The admin dashboard MUST use glassmorphism design with the following specifications:
- **Blur**: 10px backdrop blur (`backdrop-blur-xl`)
- **Rounded Corners**: Consistent 3xl/2xl rounding
- **Colors**: Dark sidebar (#1e293b), light content (#f8fafc)
- **Transparency**: Use `bg-white/70` with `backdrop-blur-xl`
- **Interactive States**: MUST implement hover effects and smooth transitions

## Navigation Structure (MANDATORY)
The admin sidebar MUST contain exactly 2 primary navigation links:
1. **Dashboard**: Analytics and overviews specific to the MVP
2. **Primary Feature**: Link directly related to core MVP functionality (e.g., "Bookings")

## Responsiveness Rules
- **Desktop-first**: Admin dashboards prioritize desktop data density
- **Mobile**: Not required for admin (exempt from mobile-first rules)
- **Table Visibility**: Ensure full row detail access on desktop
```

---

## Conclusion

By following this protocol, all future knowledge base files will:
- ✅ Align with chunker expectations
- ✅ Preserve critical keywords in searchable chunks
- ✅ Achieve 100% semantic search match rates
- ✅ Support small model training and lookup

**Enforcement**: All new rules, templates, and memory files MUST follow this protocol. Existing files will be refactored incrementally.
