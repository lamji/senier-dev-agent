# Template Lookup Protocol (Hard Rule)

## Priority: CRITICAL | Enforcement: MANDATORY

This rule defines a **hard requirement** for using `.agent/template/` as a knowledge base (footprint) for smaller/local AI models to follow established coding standards.

## 1. What is the Template Directory?

`.agent/template/` contains **exact copies** of production-ready, battle-tested components, features, and pages from this project. Each template mirrors the actual folder structure and code — serving as a **training footprint** for smaller AI models that lack deep reasoning capabilities.

## 2. When to Trigger Lookup

Template lookup happens **ONLY** when the user explicitly triggers it. Examples:
- "Design me a login page, **use the lookup**"
- "Create a hero section, **check templates first**"
- "Build a booking form, **use .agent/template**"

### Keywords That Trigger Lookup:
- "use the lookup"
- "check templates"
- "use .agent/template"
- "follow the template"
- "use the footprint"

### When NOT Triggered:
If the user does NOT mention lookup/template keywords, follow the regular MVVM rules from `coding-standard.md` and `project-structure.md` as usual.

## 3. Lookup Flow

When triggered, the AI MUST:

1. **Scan** `.agent/template/` for relevant templates matching the request.
   - Example: User says "design me a login page" → Look for `*-login` folders.
   - Example: User says "create a hero" → Look for `*-hero` folders.
2. **Read** the matching template's `readme.md` first to understand the pattern.
3. **Copy** the exact code structure, adapting only:
   - Component names (to match the new feature)
   - API endpoints (to match the new feature's backend)
   - Content/text (to match the new feature's purpose)
4. **Preserve** the MVVM pattern exactly as shown in the template:
   - `index.tsx` → View (pure UI)
   - `useXxx.ts` → ViewModel (all logic)
   - `sub-components/` → Fragmented JSX
   - `sub-helpers/` → Fragmented logic

## 4. Template Folder Structure

Every template MUST follow this exact structure:

```
.agent/template/
├── event-login/                 ← Feature template folder
│   ├── index.md                 ← View code inside markdown
│   ├── useLogin.md              ← ViewModel code inside markdown
│   ├── sub-components/          ← Fragmented UI (as .md files)
│   ├── sub-helpers/             ← Fragmented logic (as .md files)
│   └── readme.md                ← Documentation
├── event-admin/
│   ├── index.md                 ← Admin Dashboard / Table
│   ├── useAdmin.md              ← Admin Logic
│   ├── AdminLayout.md           ← Sidenav (2 links only) & layout
│   ├── sub-components/
│   │   └── BookingTable.md
│   └── readme.md
├── event-hero/
│   ├── index.md
│   ├── useHero.md
│   ├── sub-components/
│   │   └── HeroSection.md
│   ├── sub-helpers/
│   └── readme.md
├── event-booking/
│   └── ... same structure ...
```

> ⚠️ **DO NOT COPY EVERYTHING**: These templates act as a **knowledge base** only. Do NOT copy the entire folder or files into the project unless explicitly asked to "replicate" or "use the lookup" for that specific feature.
> When asked, copy ONLY the relevant patterns, adaptations, or files needed for the current task.

> ⚠️ **ALL template files are `.md` (Markdown), NOT `.tsx/.ts`.**
> The actual code is wrapped inside markdown code blocks (` ```tsx ... ``` `).
> This makes them a **knowledge base** — not executable source code.

## 5. Creating New Templates

After completing ANY significant feature, the AI MUST:

1. **Create** a new template folder in `.agent/template/` with the exact code.
2. **Write** a `readme.md` documenting:
   - What the template does
   - File-by-file breakdown
   - Dependencies and UI components used
   - MVVM mapping (which file is View, which is ViewModel)
3. **Copy** the exact production code — not simplified or pseudo-code.

## 6. Why This Matters

- **Small/Local AI Models** lack the deep reasoning to infer coding patterns from rules alone.
- **Templates provide exact examples** they can copy and adapt.
- **Reduces thinking overhead** and ensures consistent output quality.
- **Prevents pattern drift** across different AI models working on the same codebase.

## 7. Template Naming Convention

Templates are named as: `{domain}-{feature}`
- `event-login` → Login page for event platform
- `event-hero` → Hero section for event platform  
- `event-booking` → Booking form for event platform
- `event-admin` → Admin dashboard/layout for event platform (2-link sidenav rule applied)
- `gaming-login` → Login page for gaming platform (future)
- `saas-dashboard` → Dashboard for SaaS platform (future)

This allows lookup by BOTH domain and feature type. A request for "a login page" would match ALL `*-login` templates.
