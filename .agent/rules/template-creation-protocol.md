# AI Template & Package Creation Protocol

This protocol defines the strict standards for developing, documenting, and publishing AI-ready UI kits and packages within the OrbitNest ecosystem.

## 核心原则 (Core Principles)

### 1. Props-Driven "Dumb" Architecture
- **Isolation**: Packages MUST NOT contain business logic, API calls, or database queries.
- **Interface-First**: All data must be passed via TypeScript props.
- **Config-Driven**: Use a central configuration file (`admin-config.tsx`) in the host project to inject behavior into the package.

### 2. High-Density Aesthetic Standards
- **Design Language**: Glassmorphism (blur: 10px, transparent backgrounds) and curated rounded corners (3xl/2xl).
- **Interactivity**: Every clickable element MUST have hover/active states.
- **No Placeholders**: Use real, descriptive mock data and images (Unsplash) to "wow" the user at first glance.

### 3. AI-Ready Documentation ("The UI Brain")
- **Rule File**: Every major UI Kit MUST have a corresponding `.md` rule file in `.agent/rules/` (e.g., `admin-ui-kit.md`).
- **Content**: MUST document all core exports, prop interfaces, and integration snippets.
- **NPM Mirror**: The package `README.md` must mirror these technical details for human/AI parity.

## 开发流程 (Development Workflow)

1. **RAG Research**: Before starting, summarize the task in 5 words and fetch context via `senior-dev-rules`.
2. **SDK Isolation**: Develop core UI logic in `packages/[name]/src/`.
3. **Host Validation**: Use a mock/host application (`app/admin-1/`) to test the package in real-time.
4. **Build-First Verification**: 
   - MUST run `npm run build` (Exit code 0) before any major commit.
   - MUST run `npm run lint` and resolve ALL errors.
5. **Publish Preparation**: Update the `npm_publishing_plan.md` and wait for user approval before `npm publish`.

## 自动化指令 (Automation Trigger)
When a user says "Create me a [Name] package":
- **Check RAG**: Search for existing patterns in `.agent/npm-packages/` and `template-creation-protocol.md`.
- **Follow structure**: Establish the SDK/Host split immediately.
- **Standard Props**: Map standard events (`onClick`, `onChanged`, `onView`, `onUpdate`, `onDelete`) consistently across all components.
