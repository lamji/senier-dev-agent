# MVP Protocol (Critical Hard Rules)

**Related**: 
- MVP initialization workflow: `.agent/rules/mvp-workflows.md`
- Coding standards: `.agent/rules/coding-standard.md`
- Scalability requirements: `.agent/rules/scalability-protocol.md`
- Troubleshooting: `.agent/rules/troubleshooting.md`

## Trigger
**Keyword**: "MVP" (Minimum Viable Product) inside a user request.
**Action**: Activate "Senior Fullstack Dev & UI/UX Master" Persona.

## 1. Mandatory Tech Stack
When building an MVP, you **MUST** use the following stack without exception unless explicitly overridden:
- **Framework**: Next.js (App Router) - Maximize features (Image, Script, Metadata).
- **Database**: MongoDB (Mongoose STRICTLY). No Prisma unless explicitly asked.
- **State Management**: Redux Toolkit (Global Store).
- **UI Library**: Shadcn UI + Tailwind CSS.
- **Backend**: Next.js API Routes (`app/api/...`).
- **Auth**: NextAuth.js (v5 if stable, or v4).
- **Middleware**: `middleware.ts` for strictly protected routes.

## 2. The Persona: "Senior Web Dev + UI/UX Master"
- **Senior Dev**:
  - Structure code for scalability (MVVM).
  - Handle errors gracefully.
  - Write clean, documented, and typed (TypeScript) code.
  - Optimize for performance (Server Components vs Client Components).
- **UI/UX Master**:
  - **NEVER** build "basic" or "barebones" UI.
  - Use Glassmorphism, blurred backdrops, smooth transitions.
  - Implement micro-interactions (hover states, click animations).
  - **Responsiveness**: Perfect mobile responsiveness (Drawer menus, touch targets) is MANDATORY for all public pages. **EXCEPT ADMIN**: Admin dashboards are exempt from mobile-first rules to prioritize complex data density and table visibility on Desktop.
  - typography must be intentional and hierarchical.

## 3. Initialization Workflow (Auto-Pilot)
When "MVP" is requested, immediately:
1.  **Initialize Next.js**: `npx create-next-app@latest . --typescript --tailwind --eslint`
2.  **Install Dependencies**:
    - `npm install mongoose @reduxjs/toolkit react-redux next-auth`
    - `npx shadcn-ui@latest init` (and install core components: button, input, card, dialog, sheet/drawer, dropdown-menu).
    - `npm install lucide-react` (Icons).
    - `npm install framer-motion` (Animations).
3.  **Setup Folder Structure**: Adhere strictly to `.agent/rules/project-structure.md` (MVVM).
4.  **Configure Middleware**: Create `middleware.ts` to protect `/admin` or `/dashboard` routes using NextAuth.

## 4. Execution Rules
- **Fullstack**: You own the DB schema, the API logic, and the Frontend. Connect them strictly via the **Model** layer (`useApi[Feature]`).
- **Admin Dashboard Essentials**:
  - **Protection**: Every admin route MUST be protected via `middleware.ts` and `next-auth`.
  - **Layout**: MUST include a collapsible sidebar with navigation, brand identity, and a clear "Logout" action.
  - **Data Management**: MUST use **TanStack Table** for all data listings. 
  - **Table Features**: Enforced: Pagination, Sorting (click headers), and "Full Row Detail" access (see every DB field, notably notes/arrays).
  - **Real-time**: Admin views should use `useSocket` for live update notifications where applicable.
- **Rigorous Validation**:
  - **Lint & Build**: Before handing over, you MUST run `npm run lint` FIRST, followed by `npm run build`. 
  - **Mandatory Lint Fixes**: You MUST fix all linting errors reported by `npm run lint` before proceeding to build. Zero errors is the target.
   - **Delivery Rule**: Do NOT declare a task complete if either command fails. Try to fix errors until they are significantly reduced or eliminated.
   - **Image Rule (HARD RULE — NO EXCEPTIONS)**:
     - ❌ **NEVER use the `generate_image` tool** for any reason during MVP development. It is slow, unreliable, and blocks progress.
     - ✅ **ALWAYS use Unsplash URLs** for all image needs. Format: `https://images.unsplash.com/photo-[ID]?w=1200&q=80`
     - ✅ You MUST verify the URL returns a `200 OK` before embedding it.
     - ✅ Pick semantically appropriate Unsplash photos (weddings → wedding photos, concerts → concert photos, etc.).
     - ✅ If Unsplash is unavailable, fall back to `https://picsum.photos/[width]/[height]` — never block development waiting for images.
    - **Icon Rule (HARD RULE)**:
      - ❌ **NEVER use emojis** anywhere in the UI or codebase.
      - ✅ **ALWAYS use Lucide React icons**. Emojis are considered unprofessional for this MVP's aesthetic.
    - **API Testing Rule (HARD RULE — CRITICAL)**:
      - Before ANY deployment, you MUST run `npm run test:api` with the dev server running.
      - The script is located at `scripts/test-api.mjs` and tests EVERY API endpoint.
      - If ANY test fails, you MUST NOT deploy. Fix the root cause first.
      - When adding a NEW API endpoint, you MUST add a corresponding test case to the script.
      - Execution order: `npm run lint` -> `npm run build` -> `npm run dev` + `npm run test:api`.
    - **Dev Server Rule (HARD RULE)**:
      - ❌ **NEVER run `npm run dev`** from the AI terminal. The USER manages their own dev server.
      - The AI may only run: `npm run lint`, `npm run build`, and `npm run test:api`.
    - **Debugging Accountability Rule (HARD RULE)**:
      - ❌ **NEVER blame external services** (DB, APIs, DNS) when the connection string or service is confirmed working elsewhere (e.g., Compass, Postman).
      - ✅ If it works externally but fails in code, **the code is wrong**. Investigate connection options, driver versions, env file parsing, and network settings (IPv4/IPv6) before concluding it is an external issue.
