# Event Login Template

## Overview
Admin login page with glassmorphism styling, form validation, and NextAuth credentials integration. Follows strict MVVM pattern.

## MVVM Mapping

| File | Role | Description |
|------|------|-------------|
| `index.tsx` | **View** | Pure UI — renders the login form. Zero logic. |
| `useLogin.ts` | **ViewModel** | All state (username, password, error, loading) and form submission logic. |
| `sub-components/` | **Fragments** | (Empty for this template — form is small enough for one View) |
| `sub-helpers/` | **Helpers** | (Empty for this template — logic is small enough for one ViewModel) |

## Dependencies
- `next-auth/react` — `signIn()` for credentials auth
- `framer-motion` — Entrance animation
- `lucide-react` — Icons (Calendar, Lock, User)
- Shadcn: Button, Input, Label, Card

## Design Pattern
- Dark background (zinc-950) with Unsplash image overlay (opacity-20)
- Glassmorphism card (bg-black/60 backdrop-blur-xl border-white/10)
- Amber accent color for brand identity
- Icon inputs with left-aligned icons inside relative wrappers
- Motion entrance animation (fade up from y:20)

## Router Integration
`app/auth/signin/page.tsx` must be a **thin wrapper**:
```tsx
import SignInPresentation from "@/presentations/SignIn";
export default function Page() {
    return <SignInPresentation />;
}
```

## Key Rules
- View has NO useState, NO signIn calls, NO business logic
- ViewModel returns state + handlers only
- Max 300 lines per file
- Lucide icons only (no emojis)
