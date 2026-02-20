# BOOK.ME — E2E Testing Knowledge Base

> **Purpose**: This is the long-term reference document. If you are reading this 5 years from now, this file has everything you need to recreate, run, and extend the E2E testing suite.

---

## 1. Project Architecture Overview

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16.1 (App Router) | All API routes in `app/api/` |
| Auth | NextAuth v4 (JWT Strategy) | Credentials Provider (`admin`/`admin123`) |
| DB | MongoDB (Mongoose v9) | Connection via `lib/db.ts` |
| Validation | Zod v4 | Schemas in `lib/validation/booking.ts` |
| Email | Nodemailer (Gmail SMTP) | Utility in `lib/mail.ts` |
| Middleware | `proxy.ts` (root) | Rate limiting + auth whitelisting |
| State | Redux Toolkit + React Query | For frontend state, irrelevant for API tests |

---

## 2. API Endpoint Reference

### Public Endpoints (No Auth Required)
These are whitelisted in `proxy.ts` → `authorized()` callback.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/bookings` | Create a booking |
| `POST` | `/api/bookings/availability` | Check date/time availability |
| `GET` | `/api/bookings/dates` | List all booked dates |
| `GET` | `/api/bookings/find?email=&id=` | Find booking by email or ID |
| `GET` | `/api/cron/reminders` | Cron: send 2-day reminders |
| `*` | `/api/auth/*` | NextAuth routes |

### Protected Endpoints (Admin Auth Required)
These require a valid `next-auth.session-token` cookie with `role: "admin"`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/bookings` | List all bookings (admin, paginated) |
| `PATCH` | `/api/bookings/[id]` | Update booking status (approve/cancel) |

Note: Valid statuses are `pending`, `approved`, `canceled`, `completed`.

---

## 3. Admin Login Simulation

The admin panel uses NextAuth's `CredentialsProvider`. To simulate login in tests:

```typescript
// Step 1: Get CSRF token
const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
const { csrfToken } = await csrfRes.json();

// Step 2: Submit credentials
const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    username: "admin",
    password: "admin123",
    csrfToken,
    json: "true",
  }).toString(),
  redirect: "manual",
});

// Step 3: Extract cookies
const setCookies = loginRes.headers.getSetCookie();
const cookieString = setCookies.map(c => c.split(";")[0]).join("; ");
// Use `cookieString` in headers: { Cookie: cookieString }
```

**Credentials** (MVP):
- Username: `admin`
- Password: `admin123`
- Configured in: `app/api/auth/[...nextauth]/route.ts`

---

## 4. Test File Locations

| File | Scope | Auth? |
|---|---|---|
| `tests/e2e/booking-flow.test.ts` | User flow (8 tests) | No |
| `tests/e2e/admin-flow.test.ts` | Admin flow (8 tests) | Yes (login sim) |

### How to Run
```bash
# Run all E2E tests
npm run test:e2e

# Run only user tests
npx jest tests/e2e/booking-flow.test.ts --verbose

# Run only admin tests
npx jest tests/e2e/admin-flow.test.ts --verbose
```

---

## 5. `data-test-id` Convention

**Hard Rule** (from `senior-dev-rules.md` Section 2): Every interactive element MUST have a `data-test-id` with the naming convention `[section]-[type]-[action]`.

### Current Registry

| Element | data-test-id |
|---|---|
| Hero Date Picker | `hero-btn-pick-date` |
| Hero Time Select | `hero-select-time` |
| Hero Check Availability | `hero-btn-check-availability` |
| Hero Book Now | `hero-btn-book-now` |
| Header Find Booking | `header-btn-find-booking` |
| Booking Event Type | `select-event-type` |
| Booking Date Picker | `btn-pick-date` |
| Booking Time Select | `select-time` |
| Booking Client Name | `input-client-name` |
| Booking Client Email | `input-client-email` |
| Booking Client Phone | `input-client-phone` |
| Booking Notes | `input-notes` |
| Booking Submit | `btn-submit-booking` |
| Modal Search Input | `modal-input-search` |
| Modal Search Button | `modal-btn-search` |

---

## 6. Environment Variables

| Variable | Value | Used By |
|---|---|---|
| `MONGODB_URI` | `mongodb://...` | `lib/db.ts` |
| `NEXTAUTH_SECRET` | `9215091250912501925` | NextAuth JWT |
| `NEXTAUTH_URL` | `http://localhost:3000` | NextAuth |
| `EMAIL_SERVICE` | `gmail` | `lib/mail.ts` |
| `GMAIL_USER` | `lampagojick5@gmail.com` | Nodemailer |
| `GMAIL_APP_PASS` | `"uaee kmpa qwnk twph"` | Nodemailer |

---

## 7. Email Triggers

| Event | Template Function | Triggered In |
|---|---|---|
| New booking | `EmailTemplates.bookingReceived()` | `POST /api/bookings` |
| Status change | `EmailTemplates.bookingStatusChange()` | `PATCH /api/bookings/[id]` |
| 2-day reminder | `EmailTemplates.eventReminder()` | `GET /api/cron/reminders` |

---

## 8. Middleware Whitelisting (`proxy.ts`)

The NextAuth middleware at `proxy.ts` intercepts all `/api/*` and `/admin/*` routes. Public endpoints must be explicitly whitelisted in the `authorized()` callback. If a new public API is added and it returns HTML instead of JSON, it means it's being blocked by the middleware → add it to the whitelist.

---

## 9. Key Files Reference

| Purpose | Path |
|---|---|
| Middleware (Auth + Rate Limit) | `proxy.ts` |
| NextAuth Config | `app/api/auth/[...nextauth]/route.ts` |
| Booking API (POST + GET) | `app/api/bookings/route.ts` |
| Booking Status (PATCH) | `app/api/bookings/[id]/route.ts` |
| Booking Dates (GET) | `app/api/bookings/dates/route.ts` |
| Booking Find (GET) | `app/api/bookings/find/route.ts` |
| Availability (POST) | `app/api/bookings/availability/route.ts` |
| Cron Reminders (GET) | `app/api/cron/reminders/route.ts` |
| Mailer Utility | `lib/mail.ts` |
| Booking Model | `lib/models/Booking.ts` |
| Validation Schemas | `lib/validation/booking.ts` |
| Jest Config | `jest.config.js` |
| User E2E Tests | `tests/e2e/booking-flow.test.ts` |
| Admin E2E Tests | `tests/e2e/admin-flow.test.ts` |
| QA Handbook (User) | `.agent/qa/qa-hand-book-test-case.md` |
| QA Handbook (Admin) | `.agent/qa/qa-admin-test-case.md` |
| Knowledge Base (this file) | `.agent/qa/e2e-knowledge-base.md` |
| Senior Dev Rules | `.agent/workflows/senior-dev-rules.md` |

---

*Last updated: 2026-02-20. Created during the initial BOOK.ME MVP development sprint.*
