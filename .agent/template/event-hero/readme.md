# Event Hero Template

## Overview
Premium homepage hero section with glassmorphism date picker overlay, availability checking, and navigation to booking page. Full MVVM with fragmented sub-components.

## MVVM Mapping

| File | Role | Description |
|------|------|-------------|
| `index.md` | **View** | Composes all homepage sections (Hero, About, Gallery, etc.). Zero logic. |
| `useHero.md` | **ViewModel** | Date/time selection state, availability API calls, navigation to booking. |
| `sub-components/HeroSection.md` | **View Fragment** | Hero UI — background, glassmorphism card, pickers, availability, Book Now CTA. |

## Dependencies
- `framer-motion` — Entrance animations
- `lucide-react` — CalendarDays, Clock, CheckCircle, XCircle, Sparkles
- `date-fns` — Date formatting (format)
- `@/lib/axios` — Centralized API client
- `@/types/booking` — CheckAvailabilityResponse type
- `next/navigation` — useRouter for programmatic navigation
- Shadcn: Button, Calendar, Popover, Select, Badge

## Design Pattern
- Full-viewport hero with Unsplash background image
- Dark overlay (bg-black/60) for text contrast
- Glassmorphism card (bg-white/5 backdrop-blur-xl border-white/10)
- Gradient text (amber-300 to orange-400) for headline
- Staggered motion entrance animations (fade up)
- Color-coded availability feedback (emerald = available, red = taken)
- Conditional "Book Now" CTA only when slot is available

## Router Integration
`app/page.tsx` must be a **thin wrapper**:
```tsx
import HomePresentation from "@/presentations/Home";
export default function Page() {
    return <HomePresentation />;
}
```

## Navigation Flow
1. User picks date + time in HeroSection
2. Clicks "Check Availability" → POST /api/bookings/availability
3. If available → "Book Now" button appears
4. Clicks "Book Now" → navigates to /booking?date=...&time=...

## Key Rules
- View (index) has NO logic — only composes sub-components
- ViewModel handles ALL state + API calls
- Sub-component HeroSection consumes ViewModel via useHero() hook
- Max 300 lines per file
- Unsplash images only (no generate_image)
- Lucide icons only (no emojis)
