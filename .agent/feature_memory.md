# Feature Analysis Log

## [Booking System]
**Type**: Global UI Component (Drawer)
**Location**: `src/components/Booking/`
**Trigger**: Button in Header (`src/components/Layout/Header.tsx`)
**Mount Point**: Global Layout (`src/components/Layout/index.tsx`) or Root Layout (`src/app/layout.tsx`)

### Architecture
- **Isolation**: Self-contained component.
- **State**: `useBooking` (internal state) or Global Context if needed by other components.
  - *Decision*: Since it's triggered from Header but renders in Layout, we likely need a `BookingContext` or a simple state lift if they are close. 
  - *Refinement*: To keep it isolated, `Booking` component can expose a static method or event, OR we use a `Zustand` store / `Context` strictly for this feature.
- **Files**:
  - `src/components/Booking/index.tsx` (The Drawer UI)
  - `src/components/Booking/BookingTrigger.tsx` (The Button UI)
  - `src/components/Booking/useBooking.ts` (Logic/State)
  - `src/components/Booking/booking.module.css` (Styles if not using Tailwind)

### Integration Points
- **Header**: Needs to import `<BookingTrigger />`.
- **Layout**: Needs to import `<BookingDrawer />`.

### Logic Flow
1. User clicks `BookingTrigger`.
2. `useBooking` sets `isOpen = true`.
3. `BookingDrawer` slides in from right (CSS Transform).
4. Backdrop click or Close button sets `isOpen = false`.

### Implementation Rules
- Max Width: 300px.
- Height: 100vh.
- Animation: Slide-in Right.
- Aesthetic: Glassmorphism/Premium.

---

## [book.me] MVP Analysis (Event Booking Management System)

### Project Overview
**Name**: book.me
**Objective**: Fullstack MVP for event booking with real-time admin notifications.
**Senior Dev Persona**: Activated.
**UI/UX Master Mode**: Activated (Premium, Glassmorphism, Micro-interactions).

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, Redux Toolkit.
- **Backend**: NestJS (API + WebSocket), Mongoose (MongoDB).
- **Auth**: NextAuth.js.
- **Real-time**: Socket.IO.
- **Mailing**: Nodemailer (Gmail).
- **Validation**: Zod + React Hook Form.

### Architecture (MVVM)
- **Frontend**:
    - `src/presentations/Home/`: Complete homepage with Hero (Date Picker), Gallery, Reviews.
    - `src/components/Booking/`: Booking logic and components.
    - `src/components/Admin/`: Real-time dashboard.
    - `src/lib/redux/`: Global state for auth and notifications.
- **Backend (NestJS)**:
    - `BookingModule`: Schema, Controller, Service.
    - `GatewayModule`: Socket.IO for real-time alerts.
    - `MailingModule`: Nodemailer integration.

### Homepage Sections
1. **Hero**: High-impact heading, background with overlay, integrated Date Picker & Event Type selector.
2. **Body (Services)**: Grid of service cards (Wedding, Band, etc.) with hover effects.
3. **Gallery**: Masonry or high-end slider with event photos (Checked URLs).
4. **Client Reviews**: Animated testimonals (Framer Motion).
5. **Footer**: Modern dark footer with links and branding.

### Constraints Check
- **Files**: Max 300 lines (Mandatory fragmentation).
- **Strict MVVM**: Logic isolated from View.
- **Image Check**: All Unsplash URLs must be 200 OK.
- **Build Check**: `npm run build` must pass before delivery.
